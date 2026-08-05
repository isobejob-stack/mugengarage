import type { BaseEntity } from "@/lib/database/common";

// Engagement Context（bounded_context.md 3章）: 一般ユーザーの行動データ
// 初期リリースでは会員登録機能がないため匿名セッション識別子で管理する（table_definitions.md 9.1）

export interface Favorite extends BaseEntity {
  vehicle_id: string;
  session_id: string;
  customer_id: string | null;
}
