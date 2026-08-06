import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import type { VehiclePhoto } from "@/lib/inventory/types";

// FR-INV-009: 写真削除。
// BR-DEL-001（物理削除の禁止）に従い、deleted_at をセットする論理削除とする。
// Storage側の実ファイルは削除しない（このAPIでは扱わない。将来的な完全削除はバッチ運用で検討）。
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id: vehicleId, photoId } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("id", photoId)
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .maybeSingle<VehiclePhoto>();

  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "写真が見つかりません" });
  }

  const { data: photo, error } = await supabase
    .from("vehicle_photos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", photoId)
    .select()
    .single();

  if (error || !photo) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_photo",
    targetId: photoId,
    action: "delete",
  });

  return NextResponse.json({ data: photo });
}
