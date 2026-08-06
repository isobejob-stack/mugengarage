import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { vehicleFormSchema } from "@/lib/inventory/schema";
import { buildVehicleSlug } from "@/lib/inventory/slug";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminVehicles } from "@/lib/inventory/queries";
import { replaceRelatedContents } from "@/lib/related/queries";
import { replaceTaggings } from "@/lib/tags/queries";

// FR-INV-002: 車両一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const vehicles = await listAdminVehicles();
  return NextResponse.json({ data: vehicles });
}

// FR-INV-001: 車両新規登録
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

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

  const supabase = createAdminClient();

  const { data: model } = await supabase
    .from("models")
    .select("slug")
    .eq("id", parsed.data.model_id)
    .maybeSingle();

  if (!model) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "選択された車種が見つかりません",
      field: "model_id",
    });
  }

  // vehiclesテーブル自体はslug・related・tags・seoカラムを持たないため、insert対象から除外する（BR-URL-003）。
  // 新規登録時のslugは常に自動生成のみを行い、手動指定は受け付けない（FR-SEO-004の対象はPATCHのみ）。
  const { related, tags, seo: _seo, ...vehicleValues } = parsed.data;
  delete vehicleValues.slug;

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert(vehicleValues)
    .select()
    .single();

  if (error || !vehicle) {
    return apiInternalError(error);
  }

  // FR-INV-014: 関連記事／関連図鑑／関連ブログ／関連整備実績の紐付け（BR-DOM-004: 参照のみでコピーしない）
  await replaceRelatedContents("vehicle", vehicle.id, related);

  // FR-INV-012: タグの紐付け（BR-DATA-003: マスタデータとして管理）
  const { error: tagsError } = await replaceTaggings(
    "vehicle",
    vehicle.id,
    tags,
  );
  if (tagsError) {
    return apiInternalError(tagsError);
  }

  const slug = buildVehicleSlug(model.slug, vehicle.id);
  await supabase.from("seo_metas").insert({
    target_type: "vehicle",
    target_id: vehicle.id,
    slug,
  });

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle",
    targetId: vehicle.id,
    action: "create",
  });

  return NextResponse.json({ data: { ...vehicle, slug } }, { status: 201 });
}
