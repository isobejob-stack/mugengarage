-- Content Context / ブログ記事（table_definitions.md 6.1）
create table articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null,
  status text not null check (status in ('draft', 'published')),
  category text,
  scheduled_publish_at timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_articles_updated_at
before update on articles
for each row execute function set_updated_at();


create index articles_status_idx on articles (status);
create index articles_published_at_idx on articles (published_at);
create index articles_deleted_at_idx on articles (id) where deleted_at is null;

alter table articles enable row level security;
