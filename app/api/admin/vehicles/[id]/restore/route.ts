import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { getDeletedVehicleById, restoreVehicle } from "@/lib/inventory/queries";

// ISSUE-004課題1 / BR-DEL-002: 論理削除された車両の復元。
// deleted_at をnullに戻すのみで、statusは変更しない（判断根拠は lib/inventory/queries.ts の
// restoreVehicle のコメントを参照）。
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getDeletedVehicleById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "論理削除された車両が見つかりません",
    });
  }

  const { data: vehicle, error } = await restoreVehicle(id);
  if (error || !vehicle) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle",
    targetId: id,
    action: "restore",
  });

  return NextResponse.json({ data: vehicle });
}
