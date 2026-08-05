-- CRM Context / 問い合わせ（table_definitions.md 8.2）
create table inquiries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id),
  vehicle_id uuid references vehicles (id),
  channel text not null check (channel in ('line', 'phone', 'email', 'form')),
  category text not null check (
    category in ('purchase', 'repair', 'sale', 'parts', 'other')
  ),
  message text,
  response_status text not null default 'unhandled' check (
    response_status in ('unhandled', 'in_progress', 'completed')
  ),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_inquiries_updated_at
before update on inquiries
for each row execute function set_updated_at();


create index inquiries_customer_id_idx on inquiries (customer_id);
create index inquiries_response_status_idx on inquiries (response_status);

alter table inquiries enable row level security;
