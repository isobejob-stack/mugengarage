-- Inventory Context / グレード別テンプレート（table_definitions.md 4.7, FR-ADM-004）
create table grade_templates (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null unique references grades (id),
  engine_features_template text,
  common_issues_template text,
  maintenance_cost_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create trigger set_grade_templates_updated_at
before update on grade_templates
for each row execute function set_updated_at();


alter table grade_templates enable row level security;
