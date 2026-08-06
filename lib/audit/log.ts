import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, AuditActorType } from "@/lib/audit/types";

type RecordAuditLogParams =
  // 管理画面から管理者が行った操作（従来通り）。actor_typeは省略可能で、省略時は"admin"として扱う。
  | {
      actorType?: "admin";
      adminUserId: string;
      targetType: string;
      targetId: string;
      action: AuditAction;
      changes?: Record<string, unknown>;
    }
  // レビュー指摘対応（必須修正3, BR-HIST-002）: Cron等、管理者が紐付かないシステムによる自動操作。
  // admin_user_idを持たないため、actor_type: "system" を明示的に指定した呼び出しのみ許可する。
  | {
      actorType: "system";
      targetType: string;
      targetId: string;
      action: AuditAction;
      changes?: Record<string, unknown>;
    };

// BR-HIST-002: 管理画面上の主要な変更操作、およびシステムによる自動操作を監査ログとして記録する
export async function recordAuditLog(params: RecordAuditLogParams) {
  const supabase = createAdminClient();
  const actorType: AuditActorType = params.actorType ?? "admin";
  const adminUserId = params.actorType === "system" ? null : params.adminUserId;
  await supabase.from("audit_logs").insert({
    actor_type: actorType,
    admin_user_id: adminUserId,
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
  actor_type: AuditActorType;
  created_at: string;
  admin_users: { name: string } | null;
}

// FR-ADM-005: 監査ログ一覧（管理用、新しい順）。
// audit_logsは追記専用の観測ログのためページネーションは不要とし、直近100件のみ表示する。
export async function listAuditLogs() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("audit_logs")
    .select(
      "id, target_type, target_id, action, actor_type, created_at, admin_users(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []) as unknown as AuditLogListItem[];
}
