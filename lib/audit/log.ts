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

export interface AuditLogListItem {
  id: string;
  target_type: string;
  target_id: string;
  action: AuditAction;
  created_at: string;
  admin_users: { name: string } | null;
}

// FR-ADM-005: 監査ログ一覧（管理用、新しい順）。
// audit_logsは追記専用の観測ログのためページネーションは不要とし、直近100件のみ表示する。
export async function listAuditLogs() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("id, target_type, target_id, action, created_at, admin_users(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as unknown as AuditLogListItem[];
}
