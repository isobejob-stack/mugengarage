-- Knowledge Context / 図鑑項目。Vehicleへの外部キーを持たない（BR-DOM-001, table_definitions.md 5.1）
create table encyclopedia_entries (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'brand', 'series', 'model', 'generation', 'engine',
      'technology', 'history', 'term'
    )
  ),
  parent_id uuid references encyclopedia_entries (id),
  title text not null,
  slug text not null unique,
  body text not null,
  display_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_encyclopedia_entries_updated_at
before update on encyclopedia_entries
for each row execute function set_updated_at();


create index encyclopedia_entries_category_idx on encyclopedia_entries (category);
create index encyclopedia_entries_deleted_at_idx on encyclopedia_entries (id) where deleted_at is null;

alter table encyclopedia_entries enable row level security;
