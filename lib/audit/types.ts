import type { BaseEntity } from "@/lib/database/common";

// Audit Context（bounded_context.md 3章）: 全コンテキストの変更操作を横断的に記録する
// 読み取り専用の観測者であり、記録対象のデータそのものには関与しない

// restore: BR-DEL-002対応（ISSUE-004課題1）。論理削除（deleted_at）されたデータを
// 管理画面から復元した操作を記録する。
export type AuditAction =
  "create" | "update" | "delete" | "publish" | "unpublish" | "restore";

// レビュー指摘対応（必須修正3, BR-HIST-002）: 監査ログの操作者種別。
// admin: 管理画面から管理者が行った操作（admin_user_id必須）
// system: Vercel Cron Jobs等、管理者が紐付かないシステムによる自動操作（admin_user_idはnull）
export type AuditActorType = "admin" | "system";

export interface AuditLog extends BaseEntity {
  actor_type: AuditActorType;
  admin_user_id: string | null;
  target_type: string;
  target_id: string;
  action: AuditAction;
  changes: Record<string, unknown> | null;
}
