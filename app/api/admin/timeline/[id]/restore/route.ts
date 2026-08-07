import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import {
  getDeletedTimelineEventById,
  restoreTimelineEvent,
} from "@/lib/timeline/queries";

// ISSUE-004課題1 / BR-DEL-002: 論理削除された年表イベントの復元（deleted_atをnullに戻す）
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getDeletedTimelineEventById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "論理削除された年表イベントが見つかりません",
    });
  }

  const { data: event, error } = await restoreTimelineEvent(id);
  if (error || !event) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "timeline_event",
    targetId: id,
    action: "restore",
  });

  return NextResponse.json({ data: event });
}
