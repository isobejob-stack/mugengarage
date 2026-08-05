-- Inventory Context / 車両階層マスタ（table_definitions.md 4.4）
create table generations (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references series (id),
  name text not null,
  slug text not null unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_generations_updated_at
before update on generations
for each row execute function set_updated_at();


create index generations_series_id_idx on generations (series_id);
create index generations_deleted_at_idx on generations (id) where deleted_at is null;

alter table generations enable row level security;
