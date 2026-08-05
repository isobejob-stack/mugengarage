-- SEO/Meta Context / タグマスタ（BR-DATA-003, table_definitions.md 10.4）
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_tags_updated_at
before update on tags
for each row execute function set_updated_at();


alter table tags enable row level security;
