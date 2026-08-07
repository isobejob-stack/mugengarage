import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import {
  getDeletedMaintenanceRecordById,
  restoreMaintenanceRecord,
} from "@/lib/maintenance/queries";

// ISSUE-004課題1 / BR-DEL-002: 論理削除された整備実績の復元（deleted_atをnullに戻す）
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getDeletedMaintenanceRecordById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "論理削除された整備実績が見つかりません",
    });
  }

  const { data: record, error } = await restoreMaintenanceRecord(id);
  if (error || !record) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "maintenance_record",
    targetId: id,
    action: "restore",
  });

  return NextResponse.json({ data: record });
}
