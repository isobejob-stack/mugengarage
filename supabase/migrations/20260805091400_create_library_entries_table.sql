-- Knowledge Context / ライブラリ項目。販売車両に依存しない（BR-DOM-002, table_definitions.md 5.3）
create table library_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  reading_kana text,
  category text,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_library_entries_updated_at
before update on library_entries
for each row execute function set_updated_at();


create index library_entries_category_idx on library_entries (category);
create index library_entries_deleted_at_idx on library_entries (id) where deleted_at is null;

alter table library_entries enable row level security;
