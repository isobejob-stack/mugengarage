-- CRM Context / 顧客（table_definitions.md 8.1）
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  -- 将来のLINE連携を見据えた予約カラム
  line_user_id text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_customers_updated_at
before update on customers
for each row execute function set_updated_at();


create index customers_phone_idx on customers (phone);
create index customers_email_idx on customers (email);
create index customers_deleted_at_idx on customers (id) where deleted_at is null;

alter table customers enable row level security;
