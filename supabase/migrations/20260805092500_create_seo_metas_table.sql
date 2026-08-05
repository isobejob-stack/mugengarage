-- SEO/Meta Context / SEOメタ情報（ポリモーフィック、BR-URL-003, table_definitions.md 10.1）
create table seo_metas (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (
    target_type in (
      'vehicle', 'article', 'encyclopedia_entry',
      'timeline_event', 'library_entry', 'maintenance_record'
    )
  ),
  target_id uuid not null,
  title text,
  description text,
  og_image_url text,
  canonical_url text,
  structured_data jsonb,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_type, target_id)
);


create trigger set_seo_metas_updated_at
before update on seo_metas
for each row execute function set_updated_at();


create index seo_metas_target_idx on seo_metas (target_type, target_id);

alter table seo_metas enable row level security;
