import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction } from "@/lib/audit/types";

// BR-HIST-002: 管理画面上の主要な変更操作を監査ログとして記録する
export async function recordAuditLog(params: {
  adminUserId: string;
  targetType: string;
  targetId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    admin_user_id: params.adminUserId,
    target_type: params.targetType,
    target_id: params.targetId,
    action: params.action,
    changes: params.changes ?? null,
  });
}
