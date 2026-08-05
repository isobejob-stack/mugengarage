-- SEO/Meta Context / 301リダイレクト（BR-URL-002, table_definitions.md 10.3）
create table redirects (
  id uuid primary key default gen_random_uuid(),
  old_path text not null unique,
  new_path text not null,
  created_at timestamptz not null default now()
);

alter table redirects enable row level security;
