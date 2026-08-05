-- Inventory Context / 車両階層マスタ（table_definitions.md 4.3）
create table series (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models (id),
  name text not null,
  slug text not null unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_series_updated_at
before update on series
for each row execute function set_updated_at();


create index series_model_id_idx on series (model_id);
create index series_deleted_at_idx on series (id) where deleted_at is null;

alter table series enable row level security;
