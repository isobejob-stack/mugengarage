-- Audit Context / 監査ログ。読み取り専用の観測者、追記専用（BR-HIST-002,
-- table_definitions.md 11.1, migration_policy.md 7章）。
-- 追記専用のため updated_at は持たない。
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_users (id),
  target_type text not null,
  target_id uuid not null,
  action text not null check (
    action in ('create', 'update', 'delete', 'publish', 'unpublish')
  ),
  changes jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;

revoke update, delete on audit_logs from authenticated, anon;
