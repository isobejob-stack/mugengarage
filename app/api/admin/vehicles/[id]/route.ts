import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { vehicleFormSchema } from "@/lib/inventory/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminVehicleById } from "@/lib/inventory/queries";
import { ensureOwnerArchiveEntry } from "@/lib/archive/queries";
import { parseSeoInput } from "@/lib/seo/schema";
import { getSeoMeta, isSlugTakenInSeoMetas } from "@/lib/seo/queries";
import {
  syncSlugAndCreateRedirect,
  upsertSeoMetaFields,
  seoWriteErrorResponse,
} from "@/lib/seo/service";
import { replaceRelatedContents } from "@/lib/related/queries";
import { replaceTaggings } from "@/lib/tags/queries";

// FR-INV-002: 車両詳細取得（管理用、編集フォームの初期値）
// FR-INV-011: SEO編集フォームの初期値として、slug・SEOメタ情報も併せて返す
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const vehicle = await getAdminVehicleById(id);
  if (!vehicle) {
    return apiError({ code: "NOT_FOUND", message: "車両が見つかりません" });
  }

  const seoMeta = await getSeoMeta("vehicle", id);

  return NextResponse.json({
    data: {
      ...vehicle,
      slug: seoMeta?.slug ?? null,
      seo: {
        title: seoMeta?.title ?? null,
        description: seoMeta?.description ?? null,
        og_image_url: seoMeta?.og_image_url ?? null,
        canonical_url: seoMeta?.canonical_url ?? null,
      },
    },
  });
}

// FR-INV-002: 車両編集。価格が変更された場合は price_histories に自動追記する（BR-HIST-001）
// FR-INV-011 / FR-SEO-004: SEOメタ・Slugの編集にも対応する。
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
  const parsed = vehicleFormSchema.safeParse(json);
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

  const existing = await getAdminVehicleById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "車両が見つかりません" });
  }

  const currentSeo = await getSeoMeta("vehicle", id);
  const { slug: newSlug, related, tags, seo: _seo, ...vehicleValues } =
    parsed.data;

  // FR-SEO-004: Slug変更の事前バリデーション（DB書き込み前にチェックする）
  if (newSlug !== undefined && newSlug !== currentSeo?.slug) {
    if (await isSlugTakenInSeoMetas("vehicle", newSlug, id)) {
      return apiError({
        code: "VALIDATION_ERROR",
        message: "このスラッグは既に使用されています",
        field: "slug",
      });
    }
  }

  // vehiclesテーブル自体はslugカラムを持たないため、更新対象から除外する（BR-URL-003）
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .update(vehicleValues)
    .eq("id", id)
    .select()
    .single();

  if (error || !vehicle) {
    return apiInternalError(error);
  }

  // FR-INV-014: 関連記事／関連図鑑／関連ブログ／関連整備実績の紐付け（BR-DOM-004: 参照のみでコピーしない）
  await replaceRelatedContents("vehicle", id, related);

  // FR-INV-012: タグの紐付け（BR-DATA-003: マスタデータとして管理）
  await replaceTaggings("vehicle", id, tags);

  if (existing.price !== parsed.data.price) {
    await supabase.from("price_histories").insert({
      vehicle_id: id,
      old_price: existing.price,
      new_price: parsed.data.price,
      changed_by: user.id,
    });
  }

  // FR-OWN-001: 「売約済」に変わったタイミングでアーカイブを自動作成する（BR-DEL-003）
  if (existing.status !== "sold" && parsed.data.status === "sold") {
    await ensureOwnerArchiveEntry(id);
  }

  // BR-URL-002 / event_flow.md 3.7: Slug変更時は同一処理内でRedirectを自動作成する
  if (newSlug !== undefined && newSlug !== currentSeo?.slug) {
    const slugResult = await syncSlugAndCreateRedirect({
      targetType: "vehicle",
      targetId: id,
      oldSlug: currentSeo?.slug ?? null,
      newSlug,
    });
    if (!slugResult.ok) {
      return seoWriteErrorResponse(slugResult, "slug");
    }
  }

  // FR-INV-011: SEOメタ情報（Title/Description/OGP画像/canonical URL）のupsert
  if (seoParsed.data) {
    const fallbackSlug = newSlug ?? currentSeo?.slug ?? id;
    const seoResult = await upsertSeoMetaFields(
      "vehicle",
      id,
      seoParsed.data,
      fallbackSlug,
    );
    if (!seoResult.ok) {
      return seoWriteErrorResponse(seoResult, "seo.slug");
    }
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: vehicle });
}

// FR-INV-003: 車両の誤登録削除（論理削除）。
// BR-DEL-001（物理削除の禁止）に従い、deleted_at をセットする。
// BR-DEL-003: 売約済み車両はオーナーズアーカイブとして保持し続けるため、削除対象にしない。
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getAdminVehicleById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "車両が見つかりません" });
  }

  // BR-DEL-003: 売約済み車両はそもそも削除対象にしない
  if (existing.status === "sold") {
    return apiError({
      code: "CONFLICT",
      message:
        "売約済みの車両は削除できません。オーナーズアーカイブとして保持されます",
    });
  }

  const supabase = createAdminClient();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !vehicle) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle",
    targetId: id,
    action: "delete",
  });

  return NextResponse.json({ data: vehicle });
}
