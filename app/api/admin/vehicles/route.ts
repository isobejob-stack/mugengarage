import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { vehicleFormSchema } from "@/lib/inventory/schema";
import { buildVehicleSlug } from "@/lib/inventory/slug";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminVehicles } from "@/lib/inventory/queries";

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

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .insert(parsed.data)
    .select()
    .single();

  if (error || !vehicle) {
    return apiInternalError(error);
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
