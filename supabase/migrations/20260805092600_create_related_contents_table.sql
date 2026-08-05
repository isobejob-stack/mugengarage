-- SEO/Meta Context / 関連コンテンツ（ポリモーフィック、参照のみ・コピーしない、
-- BR-DOM-004, table_definitions.md 10.2）
create table related_contents (
  id uuid primary key default gen_random_uuid(),
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_related_contents_updated_at
before update on related_contents
for each row execute function set_updated_at();


create index related_contents_from_idx on related_contents (from_type, from_id);
create index related_contents_to_idx on related_contents (to_type, to_id);

alter table related_contents enable row level security;
