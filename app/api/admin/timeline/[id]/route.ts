import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { timelineEventFormSchema } from "@/lib/timeline/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminTimelineEventById } from "@/lib/timeline/queries";
import {
  listRelatedContents,
  replaceRelatedContents,
} from "@/lib/related/queries";
import { parseSeoInput } from "@/lib/seo/schema";
import { getSeoMeta } from "@/lib/seo/queries";
import { upsertSeoMetaFields, seoWriteErrorResponse } from "@/lib/seo/service";
import { buildTimelineFallbackSlug } from "@/lib/seo/paths";

// FR-TL-001: 年表イベント詳細取得（管理用、関連コンテンツ含む）
// FR-SEO-001: SEO編集フォームの初期値として、SEOメタ情報も併せて返す。
// 年表イベントは個別公開ページを持たない（BR-DOM-003）ため、Slugの編集対象には含めない。
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const event = await getAdminTimelineEventById(id);
  if (!event) {
    return apiError({
      code: "NOT_FOUND",
      message: "年表イベントが見つかりません",
    });
  }

  const [related, seoMeta] = await Promise.all([
    listRelatedContents("timeline_event", id),
    getSeoMeta("timeline_event", id),
  ]);

  return NextResponse.json({
    data: {
      ...event,
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

// FR-TL-001: 年表イベント編集
// FR-SEO-001: SEOメタの編集にも対応する（個別ページがないためSlug編集は対象外）
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
  const parsed = timelineEventFormSchema.safeParse(json);
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

  const existing = await getAdminTimelineEventById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "年表イベントが見つかりません",
    });
  }

  const { related, ...values } = parsed.data;
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("timeline_events")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error || !event) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("timeline_event", id, related);

  // FR-SEO-001: SEOメタ情報（Title/Description/OGP画像/canonical URL）のupsert。
  // 個別ページを持たないため、slugはNOT NULL制約を満たすためのダミー値を使う（ルーティングには使用しない）
  if (seoParsed.data) {
    const seoResult = await upsertSeoMetaFields(
      "timeline_event",
      id,
      seoParsed.data,
      buildTimelineFallbackSlug(id),
    );
    if (!seoResult.ok) {
      return seoWriteErrorResponse(seoResult, "seo.slug");
    }
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "timeline_event",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: event });
}

// FR-TL-001: 年表イベントの論理削除。BR-DEL-001に従い、deleted_at をセットする（物理削除は行わない）
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getAdminTimelineEventById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "年表イベントが見つかりません",
    });
  }

  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("timeline_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !event) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "timeline_event",
    targetId: id,
    action: "delete",
  });

  return NextResponse.json({ data: event });
}
