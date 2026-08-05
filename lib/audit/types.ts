import type { BaseEntity } from "@/lib/database/common";

// Audit Context（bounded_context.md 3章）: 全コンテキストの変更操作を横断的に記録する
// 読み取り専用の観測者であり、記録対象のデータそのものには関与しない

export type AuditAction =
  "create" | "update" | "delete" | "publish" | "unpublish";

export interface AuditLog extends BaseEntity {
  admin_user_id: string;
  target_type: string;
  target_id: string;
  action: AuditAction;
  changes: Record<string, unknown> | null;
}
