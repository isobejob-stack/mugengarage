import type { BaseEntity, SoftDeletable } from "@/lib/database/common";

// Archive Context（bounded_context.md 3章）: 売約済み車両の資産としての保持（BR-DEL-003）

export interface OwnerArchiveEntry extends BaseEntity, SoftDeletable {
  vehicle_id: string;
  restoration_history: string | null;
  sales_history: string | null;
  // 将来対応：現時点では入力欄のみ用意（table_definitions.md 7.1）
  owner_comment: string | null;
  is_published: boolean;
}
