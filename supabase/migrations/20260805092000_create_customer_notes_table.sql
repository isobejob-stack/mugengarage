-- CRM Context / 顧客メモ（table_definitions.md 8.3）
create table customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_customer_notes_updated_at
before update on customer_notes
for each row execute function set_updated_at();


create index customer_notes_customer_id_idx on customer_notes (customer_id);

alter table customer_notes enable row level security;
