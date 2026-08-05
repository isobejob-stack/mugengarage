-- SEO/Meta Context / タグ紐付け（ポリモーフィック、table_definitions.md 10.5）
create table taggings (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tags (id),
  taggable_type text not null check (taggable_type in ('vehicle', 'article')),
  taggable_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tag_id, taggable_type, taggable_id)
);

create index taggings_taggable_idx on taggings (taggable_type, taggable_id);

alter table taggings enable row level security;
