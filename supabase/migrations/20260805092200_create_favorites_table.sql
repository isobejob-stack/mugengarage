-- Engagement Context / お気に入り（table_definitions.md 9.1）
create table favorites (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id),
  session_id text not null,
  customer_id uuid references customers (id),
  created_at timestamptz not null default now(),
  unique (vehicle_id, session_id)
);

alter table favorites enable row level security;
