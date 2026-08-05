-- 認証コンテキスト: Supabase Auth (auth.users) と1:1で連携する管理者プロフィール
-- （table_definitions.md 12.1, authentication.md）
create table admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  -- 将来のマルチユーザー・権限拡張を見据えた予約カラム（FR-ADM-002）
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_admin_users_updated_at
before update on admin_users
for each row execute function set_updated_at();


alter table admin_users enable row level security;
