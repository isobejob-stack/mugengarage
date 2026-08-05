-- Archive Context / オーナーズアーカイブ。売約済み車両は削除せずここに保持する
-- （BR-DEL-003, table_definitions.md 7.1）
create table owner_archive_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null unique references vehicles (id),
  restoration_history text,
  sales_history text,
  -- 将来対応：現時点では入力欄のみ用意
  owner_comment text,
  is_published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_owner_archive_entries_updated_at
before update on owner_archive_entries
for each row execute function set_updated_at();


alter table owner_archive_entries enable row level security;
