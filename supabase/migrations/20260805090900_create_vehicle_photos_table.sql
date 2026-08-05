-- Inventory Context / 車両写真（table_definitions.md 4.8）
create table vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id),
  storage_path text not null,
  display_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_vehicle_photos_updated_at
before update on vehicle_photos
for each row execute function set_updated_at();


create index vehicle_photos_vehicle_id_idx on vehicle_photos (vehicle_id);

alter table vehicle_photos enable row level security;
