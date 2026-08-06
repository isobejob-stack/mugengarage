import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { libraryEntryFormSchema } from "@/lib/library/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminLibraryEntryById } from "@/lib/library/queries";
import {
  listRelatedContents,
  replaceRelatedContents,
} from "@/lib/related/queries";
import { parseSeoInput } from "@/lib/seo/schema";
import { getSeoMeta, isSlugTakenInSeoMetas } from "@/lib/seo/queries";
import {
  syncSlugAndCreateRedirect,
  upsertSeoMetaFields,
  seoWriteErrorResponse,
} from "@/lib/seo/service";

// FR-LIB-001: ライブラリ項目詳細取得（管理用、関連コンテンツ含む）
// FR-SEO-001: SEO編集フォームの初期値として、SEOメタ情報も併せて返す
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const entry = await getAdminLibraryEntryById(id);
  if (!entry) {
    return apiError({
      code: "NOT_FOUND",
      message: "ライブラリ項目が見つかりません",
    });
  }

  const [related, seoMeta] = await Promise.all([
    listRelatedContents("library_entry", id),
    getSeoMeta("library_entry", id),
  ]);

  return NextResponse.json({
    data: {
      ...entry,
      related,
      seo: {
        title: seoMeta?.title ?? null,
        description: seoMeta?.description ?? null,
        og_image_url: seoMeta?.og_image_url ?? null,
        canonical_url: seoMeta?.canonical_url ?? null,
      },
    },
  });
}

// FR-LIB-001: ライブラリ項目編集
// FR-SEO-001 / FR-SEO-004: SEOメタ・Slugの編集にも対応する。
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
  const parsed = libraryEntryFormSchema.safeParse(json);
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
  const existing = await getAdminLibraryEntryById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "ライブラリ項目が見つかりません",
    });
  }

  const slugChanged = parsed.data.slug !== existing.slug;

  if (slugChanged) {
    const { data: slugTaken } = await supabase
      .from("library_entries")
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
    if (await isSlugTakenInSeoMetas("library_entry", parsed.data.slug, id)) {
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
      targetType: "library_entry",
      targetId: id,
      oldSlug: existing.slug,
      newSlug: parsed.data.slug,
    });
    if (!slugResult.ok) {
      return seoWriteErrorResponse(slugResult, "slug");
    }
  }

  const { related, ...values } = parsed.data;
  const { data: entry, error } = await supabase
    .from("library_entries")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("library_entry", id, related);

  // FR-SEO-001: SEOメタ情報（Title/Description/OGP画像/canonical URL）のupsert
  if (seoParsed.data) {
    const seoResult = await upsertSeoMetaFields(
      "library_entry",
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
    targetType: "library_entry",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: entry });
}

// FR-LIB-001: ライブラリ項目の論理削除。BR-DEL-001に従い、deleted_at をセットする（物理削除は行わない）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getAdminLibraryEntryById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "ライブラリ項目が見つかりません",
    });
  }

  const supabase = createAdminClient();
  const { data: entry, error } = await supabase
    .from("library_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "library_entry",
    targetId: id,
    action: "delete",
  });

  return NextResponse.json({ data: entry });
}
