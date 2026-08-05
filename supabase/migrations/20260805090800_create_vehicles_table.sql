-- Inventory Context / コアテーブル。車両情報の唯一のSSOT（BR-DATA-002, table_definitions.md 4.6）
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references manufacturers (id),
  model_id uuid not null references models (id),
  series_id uuid references series (id),
  generation_id uuid references generations (id),
  grade_id uuid references grades (id),
  status text not null check (
    status in ('published', 'draft', 'sold', 'negotiating', 'coming_soon')
  ),
  is_recommended boolean not null default false,
  is_new_arrival boolean not null default false,
  price integer not null,
  engine text,
  engine_model_code text,
  displacement_cc integer,
  horsepower integer,
  torque text,
  transmission text,
  drivetrain text,
  body_type text,
  model_year integer,
  registration_year integer,
  mileage_km integer,
  shaken_expiry date,
  owner_count integer,
  indoor_storage boolean,
  accident_history boolean,
  interior_color text,
  exterior_color text,
  seat_material text,
  vin text unique,
  sales_comment text,
  manager_comment text,
  story text,
  sourcing_background text,
  appeal_points text,
  engine_features text,
  common_issues text,
  maintenance_cost text,
  purchase_notes text,
  recommended_points text,
  maintenance_details text,
  custom_details text,
  other_notes text,
  display_order integer not null default 0,
  scheduled_publish_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_vehicles_updated_at
before update on vehicles
for each row execute function set_updated_at();


-- index_strategy.md 4.1: 検索・絞り込みで使われるカラムに絞ってインデックスを張る
create index vehicles_status_idx on vehicles (status);
create index vehicles_manufacturer_id_idx on vehicles (manufacturer_id);
create index vehicles_model_id_idx on vehicles (model_id);
create index vehicles_series_id_idx on vehicles (series_id);
create index vehicles_generation_id_idx on vehicles (generation_id);
create index vehicles_grade_id_idx on vehicles (grade_id);
create index vehicles_price_idx on vehicles (price);
create index vehicles_model_year_idx on vehicles (model_year);
create index vehicles_mileage_km_idx on vehicles (mileage_km);
create index vehicles_display_order_idx on vehicles (display_order);
create index vehicles_deleted_at_idx on vehicles (id) where deleted_at is null;

alter table vehicles enable row level security;
