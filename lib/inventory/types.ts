import type { BaseEntity, SoftDeletable } from "@/lib/database/common";

// Inventory Context（bounded_context.md 3章）: 車両そのものの管理。唯一のSSOT（BR-DATA-002）

// 03_non_functional_requirements.md 9章: アップロードファイルのサイズ上限（1ファイルあたり）。
// サーバー（app/api/admin/vehicles/[id]/photos/route.ts）・クライアント（vehicle-media-manager.tsx）双方で
// 同じ上限値を参照する（型を持たないため server-only な lib/inventory/storage.ts ではなくこちらに置く）。
export const MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export interface Manufacturer extends BaseEntity, SoftDeletable {
  name: string;
  slug: string;
}

export interface Model extends BaseEntity, SoftDeletable {
  manufacturer_id: string;
  name: string;
  slug: string;
}

export interface Series extends BaseEntity, SoftDeletable {
  model_id: string;
  name: string;
  slug: string;
}

export interface Generation extends BaseEntity, SoftDeletable {
  series_id: string;
  name: string;
  slug: string;
}

export interface Grade extends BaseEntity, SoftDeletable {
  generation_id: string;
  name: string;
  slug: string;
}

export interface GradeTemplate extends BaseEntity {
  grade_id: string;
  engine_features_template: string | null;
  common_issues_template: string | null;
  maintenance_cost_template: string | null;
}

export type VehicleStatus =
  "published" | "draft" | "sold" | "negotiating" | "coming_soon";

export interface Vehicle extends BaseEntity, SoftDeletable {
  manufacturer_id: string;
  model_id: string;
  series_id: string | null;
  generation_id: string | null;
  grade_id: string | null;
  status: VehicleStatus;
  is_recommended: boolean;
  is_new_arrival: boolean;
  price: number;
  total_price: number | null;
  // 取りうる値はDBのCHECK制約と揃える（supabase/migrations/20260813180000）。
  // string で持つとフォームの列挙型に代入できず、値の取り違えも検出できないため。
  shaken_status: "inspection_included" | "valid_until" | "none" | null;
  legal_maintenance: "included" | "separate" | "none" | null;
  // 保証（warranty_type / warranty_months / warranty_km）は2026-08-17に廃止。
  // DBのカラムは残しているが、アプリでは読み書きしない。
  recycle_fee: "included" | "separate" | "none" | null;
  steering_side: "right" | "left" | null;
  fuel_type: string | null;
  capacity: number | null;
  door_count: number | null;
  has_record_book: boolean | null;
  is_non_smoking: boolean | null;
  model_code: string | null;
  location_text: string | null;
  engine: string | null;
  engine_model_code: string | null;
  displacement_cc: number | null;
  horsepower: number | null;
  torque: string | null;
  transmission: string | null;
  drivetrain: string | null;
  body_type: string | null;
  model_year: number | null;
  registration_year: number | null;
  mileage_km: number | null;
  shaken_expiry: string | null;
  owner_count: number | null;
  indoor_storage: boolean | null;
  accident_history: boolean | null;
  interior_color: string | null;
  exterior_color: string | null;
  seat_material: string | null;
  vin: string | null;
  sales_comment: string | null;
  manager_comment: string | null;
  story: string | null;
  sourcing_background: string | null;
  appeal_points: string | null;
  engine_features: string | null;
  common_issues: string | null;
  maintenance_cost: string | null;
  purchase_notes: string | null;
  recommended_points: string | null;
  maintenance_details: string | null;
  custom_details: string | null;
  other_notes: string | null;
  display_order: number;
  scheduled_publish_at: string | null;
}

export interface VehiclePhoto extends BaseEntity, SoftDeletable {
  vehicle_id: string;
  storage_path: string;
  display_order: number;
}

export interface VehicleVideo extends BaseEntity {
  vehicle_id: string;
  video_url: string;
  display_order: number;
}

// price_histories は追記専用（Append Only）。UPDATE/DELETEを行わない（BR-HIST-001, migration_policy.md 7章）
export interface PriceHistory extends BaseEntity {
  vehicle_id: string;
  old_price: number;
  new_price: number;
  changed_at: string;
  changed_by: string | null;
}
