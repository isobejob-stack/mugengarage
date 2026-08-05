-- Inventory Context / 車両階層マスタ（table_definitions.md 4.2）
create table models (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references manufacturers (id),
  name text not null,
  slug text not null unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_models_updated_at
before update on models
for each row execute function set_updated_at();


create index models_manufacturer_id_idx on models (manufacturer_id);
create index models_deleted_at_idx on models (id) where deleted_at is null;

alter table models enable row level security;
