-- Knowledge Context / 年表イベント。特定車両インスタンスには紐付けない
-- （BR-DOM-003, table_definitions.md 5.2）
create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  event_date date not null,
  date_precision text not null check (date_precision in ('year', 'month', 'day')),
  category text not null check (
    category in ('model_launch', 'engine_launch', 'motorsport', 'history', 'other')
  ),
  title text not null,
  body text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_timeline_events_updated_at
before update on timeline_events
for each row execute function set_updated_at();


create index timeline_events_category_idx on timeline_events (category);
create index timeline_events_event_date_idx on timeline_events (event_date);
create index timeline_events_deleted_at_idx on timeline_events (id) where deleted_at is null;

alter table timeline_events enable row level security;
