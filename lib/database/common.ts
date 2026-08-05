// 全テーブル共通のカラム（table_definitions.md 3章 共通ルール）
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// 論理削除対象テーブルが持つカラム（BR-DEL-001）
export interface SoftDeletable {
  deleted_at: string | null;
}
