-- CRM Context / リマインダー（table_definitions.md 8.4）
create table reminders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id),
  title text not null,
  due_date date not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_reminders_updated_at
before update on reminders
for each row execute function set_updated_at();


create index reminders_customer_id_idx on reminders (customer_id);

alter table reminders enable row level security;
