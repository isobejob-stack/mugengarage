import { z } from "zod";
import { relatedTargetSchema } from "@/lib/related/schema";
import { seoFormFieldsSchema } from "@/lib/seo/schema";

// FR-MNT-001: 整備実績の入力スキーマ（table_definitions.md 6.2準拠）
export const maintenanceRecordFormSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .regex(/^[a-z0-9-]+$/, "半角英数字とハイフンのみ使用できます"),
  category: z.string().nullable(),
  issue_description: z.string().nullable(),
  cost: z.number().nullable(),
  body: z.string().min(1, "本文を入力してください"),
  related: z.array(relatedTargetSchema),
  // FR-SEO-001: SEOメタ情報（Title/Description/OGP画像/canonical URL）。編集画面でのみ入力対象とする
  seo: seoFormFieldsSchema.optional(),
});

export type MaintenanceRecordFormValues = z.infer<
  typeof maintenanceRecordFormSchema
>;

export const emptyMaintenanceRecordFormValues: MaintenanceRecordFormValues = {
  title: "",
  slug: "",
  category: "",
  issue_description: "",
  cost: null,
  body: "",
  related: [],
};

// SCR-PUB-013: 一覧のカテゴリ絞り込みで使う代表的な分類（自由入力欄への入力候補、BR-DATA-003によりハードコード強制はしない）
export const maintenanceCategorySuggestions = ["修理", "レストア", "整備"];
