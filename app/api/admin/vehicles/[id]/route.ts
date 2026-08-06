import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { vehicleFormSchema } from "@/lib/inventory/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminVehicleById } from "@/lib/inventory/queries";

// FR-INV-002: 車両詳細取得（管理用、編集フォームの初期値）
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

  return NextResponse.json({ data: vehicle });
}

// FR-INV-002: 車両編集。価格が変更された場合は price_histories に自動追記する（BR-HIST-001）
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

  const supabase = createAdminClient();

  const existing = await getAdminVehicleById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "車両が見つかりません" });
  }

  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error || !vehicle) {
    return apiInternalError(error);
  }

  if (existing.price !== parsed.data.price) {
    await supabase.from("price_histories").insert({
      vehicle_id: id,
      old_price: existing.price,
      new_price: parsed.data.price,
      changed_by: user.id,
    });
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: vehicle });
}
