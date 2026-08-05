// 認証コンテキスト（table_definitions.md 12章）: Supabase Authのauth.usersと1:1で連携する拡張プロフィール

export interface AdminUser {
  id: string;
  name: string;
  // 将来のマルチユーザー・権限拡張を見据えた予約カラム（FR-ADM-002, authentication.md 5章）
  role: string;
}
