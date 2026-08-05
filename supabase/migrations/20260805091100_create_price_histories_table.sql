-- Inventory Context / 価格履歴。追記専用（Append Only）、UPDATE/DELETEを行わない
-- （BR-HIST-001, table_definitions.md 4.10, migration_policy.md 7章）。
-- 追記専用のため updated_at は持たない（changed_at が記録時刻を兼ねる）。
create table price_histories (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id),
  old_price integer not null,
  new_price integer not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references admin_users (id)
);

create index price_histories_vehicle_id_idx on price_histories (vehicle_id);

alter table price_histories enable row level security;

revoke update, delete on price_histories from authenticated, anon;
