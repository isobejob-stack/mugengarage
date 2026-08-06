import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { articleFormSchema } from "@/lib/content/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminArticleById } from "@/lib/content/queries";
import { parseSeoInput } from "@/lib/seo/schema";
import { getSeoMeta, isSlugTakenInSeoMetas } from "@/lib/seo/queries";
import {
  syncSlugAndCreateRedirect,
  upsertSeoMetaFields,
  seoWriteErrorResponse,
} from "@/lib/seo/service";
import { replaceTaggings } from "@/lib/tags/queries";

// FR-BLOG-001: 記事詳細取得（管理用、編集フォームの初期値）
// FR-BLOG-005: SEO編集フォームの初期値として、SEOメタ情報も併せて返す
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const article = await getAdminArticleById(id);
  if (!article) {
    return apiError({ code: "NOT_FOUND", message: "記事が見つかりません" });
  }

  const seoMeta = await getSeoMeta("article", id);

  return NextResponse.json({
    data: {
      ...article,
      seo: {
        title: seoMeta?.title ?? null,
        description: seoMeta?.description ?? null,
        og_image_url: seoMeta?.og_image_url ?? null,
        canonical_url: seoMeta?.canonical_url ?? null,
      },
    },
  });
}

// FR-BLOG-001: 記事編集
// FR-BLOG-005 / FR-SEO-004: SEOメタ・Slugの編集にも対応する。
// Slug変更時は同一リクエストの中で必ずredirectsへ自動登録する（BR-URL-002, event_flow.md 3.7）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = articleFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const seoParsed = parseSeoInput((json as { seo?: unknown } | null)?.seo);
  if (!seoParsed.success) {
    const first = seoParsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: `seo.${first.path.join(".")}`,
    });
  }

  const supabase = createAdminClient();

  const existing = await getAdminArticleById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "記事が見つかりません" });
  }

  const slugChanged = parsed.data.slug !== existing.slug;

  if (slugChanged) {
    const { data: slugTaken } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();

    if (slugTaken) {
      return apiError({
        code: "CONFLICT",
        message: "このスラッグは既に使用されています",
        field: "slug",
      });
    }

    // FR-SEO-004 / BR-URL-003: seo_metas.slugはコンテンツ種別内でユニーク
    if (await isSlugTakenInSeoMetas("article", parsed.data.slug, id)) {
      return apiError({
        code: "VALIDATION_ERROR",
        message: "このスラッグは既に使用されています",
        field: "slug",
      });
    }
  }

  // BR-URL-002 / event_flow.md 3.7: Slug変更時は、自テーブルのslug更新より先にRedirect作成を
  // 確定させる。ここで失敗した場合は自テーブルを更新しない（レビュー指摘対応・必須修正1）。
  // 先に自テーブルをコミットしてしまうと、後続のRedirect作成失敗時に「旧URLは404になったが
  // リダイレクトは存在しない」という部分失敗状態（BR-URL-002違反）になり得るため、安全側に倒す。
  if (slugChanged) {
    const slugResult = await syncSlugAndCreateRedirect({
      targetType: "article",
      targetId: id,
      oldSlug: existing.slug,
      newSlug: parsed.data.slug,
    });
    if (!slugResult.ok) {
      return seoWriteErrorResponse(slugResult, "slug");
    }
  }

  const nowPublishing =
    existing.status !== "published" && parsed.data.status === "published";

  // articlesテーブル自体はtags/seoカラムを持たないため、update対象から除外する
  // （tagsはtaggings、seoはseo_metasで別途管理）
  const { tags, seo: _seo, ...articleValues } = parsed.data;

  const { data: article, error } = await supabase
    .from("articles")
    .update({
      ...articleValues,
      published_at: nowPublishing
        ? new Date().toISOString()
        : existing.published_at,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !article) {
    return apiInternalError(error);
  }

  // FR-BLOG-002: タグの紐付け（BR-DATA-003: マスタデータとして管理）
  const { error: tagsError } = await replaceTaggings("article", id, tags);
  if (tagsError) {
    return apiInternalError(tagsError);
  }

  // FR-BLOG-005: SEOメタ情報（Title/Description/OGP画像/canonical URL）のupsert
  if (seoParsed.data) {
    const seoResult = await upsertSeoMetaFields(
      "article",
      id,
      seoParsed.data,
      parsed.data.slug,
    );
    if (!seoResult.ok) {
      return seoWriteErrorResponse(seoResult, "seo.slug");
    }
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "article",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: article });
}

// FR-BLOG-001: 記事の論理削除。BR-DEL-001に従い、deleted_at をセットする（物理削除は行わない）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getAdminArticleById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "記事が見つかりません" });
  }

  const supabase = createAdminClient();
  const { data: article, error } = await supabase
    .from("articles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !article) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "article",
    targetId: id,
    action: "delete",
  });

  return NextResponse.json({ data: article });
}
