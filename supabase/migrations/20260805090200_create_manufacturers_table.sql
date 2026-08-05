-- Inventory Context / 車両階層マスタ（table_definitions.md 4.1, 05_glossary.md 3章）
create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_manufacturers_updated_at
before update on manufacturers
for each row execute function set_updated_at();


create index manufacturers_deleted_at_idx on manufacturers (id) where deleted_at is null;

alter table manufacturers enable row level security;
