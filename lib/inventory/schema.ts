import { z } from "zod";
import { seoFormFieldsSchema, slugValueSchema } from "@/lib/seo/schema";
import { relatedTargetSchema } from "@/lib/related/schema";

// FR-INV-001/002: 車両登録・編集フォームの入力スキーマ（table_definitions.md 4.6準拠）
export const vehicleFormSchema = z.object({
  // FR-SEO-004: vehiclesテーブル自体はslugを持たない（seo_metas.slugが正、BR-URL-003）ため任意項目とする。
  // 新規登録時は自動生成（lib/inventory/slug.ts）に任せ、編集時のみ明示的な変更を受け付ける。
  slug: slugValueSchema.optional(),
  // FR-INV-011: SEOメタ情報（Title/Description/OGP画像/canonical URL）。編集画面でのみ入力対象とする
  seo: seoFormFieldsSchema.optional(),
  // FR-INV-014: 関連記事／関連図鑑／関連ブログ／関連整備実績の紐付け（BR-DOM-004: 参照のみでコピーしない）
  related: z.array(relatedTargetSchema),
  // FR-INV-012: タグ付け（BR-DATA-003: ハードコードせず管理画面から追加できるマスタデータとして管理する）
  tags: z.array(z.string().uuid()),
  manufacturer_id: z.string().uuid("メーカーを選択してください"),
  model_id: z.string().uuid("車種を選択してください"),
  series_id: z.string().uuid().nullable(),
  generation_id: z.string().uuid().nullable(),
  grade_id: z.string().uuid().nullable(),
  status: z.enum(["published", "draft", "sold", "negotiating", "coming_soon"]),
  is_recommended: z.boolean(),
  is_new_arrival: z.boolean(),
  price: z
    .number()
    .int("価格は整数で入力してください")
    .min(0, "価格は0以上で入力してください"),

  engine: z.string().nullable(),
  engine_model_code: z.string().nullable(),
  displacement_cc: z.number().int().nullable(),
  horsepower: z.number().int().nullable(),
  torque: z.string().nullable(),
  transmission: z.string().nullable(),
  drivetrain: z.string().nullable(),
  body_type: z.string().nullable(),
  model_year: z.number().int().nullable(),
  registration_year: z.number().int().nullable(),
  mileage_km: z.number().int().nullable(),
  shaken_expiry: z.string().nullable(),
  owner_count: z.number().int().nullable(),
  indoor_storage: z.boolean().nullable(),
  accident_history: z.boolean().nullable(),
  interior_color: z.string().nullable(),
  exterior_color: z.string().nullable(),
  seat_material: z.string().nullable(),
  vin: z.string().nullable(),

  sales_comment: z.string().nullable(),
  manager_comment: z.string().nullable(),
  story: z.string().nullable(),
  sourcing_background: z.string().nullable(),
  appeal_points: z.string().nullable(),
  engine_features: z.string().nullable(),
  common_issues: z.string().nullable(),
  maintenance_cost: z.string().nullable(),
  purchase_notes: z.string().nullable(),
  recommended_points: z.string().nullable(),
  maintenance_details: z.string().nullable(),
  custom_details: z.string().nullable(),
  other_notes: z.string().nullable(),

  scheduled_publish_at: z.string().nullable(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const emptyVehicleFormValues: VehicleFormValues = {
  related: [],
  tags: [],
  manufacturer_id: "",
  model_id: "",
  series_id: null,
  generation_id: null,
  grade_id: null,
  status: "draft",
  is_recommended: false,
  is_new_arrival: false,
  price: 0,
  engine: null,
  engine_model_code: null,
  displacement_cc: null,
  horsepower: null,
  torque: null,
  transmission: null,
  drivetrain: null,
  body_type: null,
  model_year: null,
  registration_year: null,
  mileage_km: null,
  shaken_expiry: null,
  owner_count: null,
  indoor_storage: null,
  accident_history: null,
  interior_color: null,
  exterior_color: null,
  seat_material: null,
  vin: null,
  sales_comment: null,
  manager_comment: null,
  story: null,
  sourcing_background: null,
  appeal_points: null,
  engine_features: null,
  common_issues: null,
  maintenance_cost: null,
  purchase_notes: null,
  recommended_points: null,
  maintenance_details: null,
  custom_details: null,
  other_notes: null,
  scheduled_publish_at: null,
};

// FR-INV-010: 動画URL登録フォームの入力スキーマ（table_definitions.md 4.9準拠）
// 動画ファイル自体はアップロードせず、YouTube等の外部URLのみを保持する
export const vehicleVideoFormSchema = z.object({
  video_url: z
    .string()
    .trim()
    .min(1, "動画URLを入力してください")
    .url("有効なURLを入力してください"),
});

export type VehicleVideoFormValues = z.infer<typeof vehicleVideoFormSchema>;

// FR-INV-009: 写真並び替えフォームの入力スキーマ
export const vehiclePhotoReorderSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1, "並び替え対象の写真がありません"),
});
