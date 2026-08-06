import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRedirect } from "@/lib/seo/redirects";
import { buildPublicPath } from "@/lib/seo/paths";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import type { SeoFieldsInput } from "@/lib/seo/schema";
import type { SeoTargetType } from "@/lib/seo/types";

export type SeoWriteResult =
  | { ok: true }
  | { ok: false; reason: "SLUG_CONFLICT" }
  | { ok: false; reason: "DB_ERROR"; error: unknown };

// レビュー指摘対応（必須修正2）: SLUG_CONFLICT（予見可能な業務エラー）とDB_ERROR（想定外エラー）を
// 呼び出し側で一律 apiInternalError に丸めてしまうと、単なるSlug重複が500 INTERNAL_ERRORとして
// 運用者に表示され「サーバーエラー」と誤解を与える。syncSlugAndCreateRedirect /
// upsertSeoMetaFields の失敗結果をAPIレスポンスへ変換する処理を1箇所に集約し、
// 呼び出し側（各admin route）での分岐漏れ・表記ゆれを防ぐ。
export function seoWriteErrorResponse(
  result: Extract<SeoWriteResult, { ok: false }>,
  field: string,
) {
  if (result.reason === "SLUG_CONFLICT") {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "このスラッグは既に使用されています",
      field,
    });
  }
  return apiInternalError(result.error);
}

// FR-SEO-004 / BR-URL-002 / event_flow.md 3.7:
// seo_metas.slug を更新し、旧Slugが存在した場合は同一処理内で必ずRedirectを自動作成する。
// 呼び出し側は事前に isSlugTakenInSeoMetas 等で重複チェックを済ませたうえで呼び出すこと
// （SLUG_CONFLICTはDBのunique制約違反を最終防衛線として捕捉した場合のみ返る）。
export async function syncSlugAndCreateRedirect(params: {
  targetType: SeoTargetType;
  targetId: string;
  oldSlug: string | null;
  newSlug: string;
}): Promise<SeoWriteResult> {
  const { targetType, targetId, oldSlug, newSlug } = params;
  if (oldSlug === newSlug) return { ok: true };

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("seo_metas")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("seo_metas")
        .update({ slug: newSlug })
        .eq("id", existing.id)
    : await supabase
        .from("seo_metas")
        .insert({
          target_type: targetType,
          target_id: targetId,
          slug: newSlug,
        });

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "SLUG_CONFLICT" };
    return { ok: false, reason: "DB_ERROR", error };
  }

  // BR-URL-002: 旧Slugが存在した場合（新規作成時は存在しない）のみRedirectを作成する
  if (oldSlug) {
    const oldPath = buildPublicPath(targetType, oldSlug);
    const newPath = buildPublicPath(targetType, newSlug);
    if (oldPath && newPath) {
      await createRedirect(oldPath, newPath);
    }
  }

  return { ok: true };
}

// FR-INV-011/FR-BLOG-005/FR-ENC-004/FR-SEO-001:
// Title/Description/OGP画像/canonical URLを、既存のseo_metas行（target_type+target_id）に対してupsertする。
// slugはここでは変更しない（BR-URL-003。slug変更はsyncSlugAndCreateRedirectで扱う）。
// seo_metas行がまだ存在しない場合は fallbackSlug を使って新規作成する
// （記事・図鑑等はvehiclesと異なり、これまでseo_metas行が一切作成されていないため）。
export async function upsertSeoMetaFields(
  targetType: SeoTargetType,
  targetId: string,
  fields: SeoFieldsInput,
  fallbackSlug: string,
): Promise<SeoWriteResult> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("seo_metas")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("seo_metas").update(fields).eq("id", existing.id)
    : await supabase.from("seo_metas").insert({
        target_type: targetType,
        target_id: targetId,
        slug: fallbackSlug,
        ...fields,
      });

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "SLUG_CONFLICT" };
    return { ok: false, reason: "DB_ERROR", error };
  }

  return { ok: true };
}
