-- Inventory Context / 車両動画（外部URL、table_definitions.md 4.9, system_architecture.md 4.4）
create table vehicle_videos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles (id),
  video_url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_vehicle_videos_updated_at
before update on vehicle_videos
for each row execute function set_updated_at();


create index vehicle_videos_vehicle_id_idx on vehicle_videos (vehicle_id);

alter table vehicle_videos enable row level security;
