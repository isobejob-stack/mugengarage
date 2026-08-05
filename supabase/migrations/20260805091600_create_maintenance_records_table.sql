-- Content Context / 整備実績（table_definitions.md 6.2）
create table maintenance_records (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text,
  issue_description text,
  cost integer,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_maintenance_records_updated_at
before update on maintenance_records
for each row execute function set_updated_at();


create index maintenance_records_category_idx on maintenance_records (category);
create index maintenance_records_deleted_at_idx on maintenance_records (id) where deleted_at is null;

alter table maintenance_records enable row level security;
