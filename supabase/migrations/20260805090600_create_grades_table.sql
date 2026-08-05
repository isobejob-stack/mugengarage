-- Inventory Context / 車両階層マスタ（table_definitions.md 4.5）
create table grades (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations (id),
  name text not null,
  slug text not null unique,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_grades_updated_at
before update on grades
for each row execute function set_updated_at();


create index grades_generation_id_idx on grades (generation_id);
create index grades_deleted_at_idx on grades (id) where deleted_at is null;

alter table grades enable row level security;
