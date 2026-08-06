import { z } from "zod";
import { relatedTargetSchema } from "@/lib/related/schema";
import { seoFormFieldsSchema } from "@/lib/seo/schema";

// FR-TL-001: 年表イベントの入力スキーマ（table_definitions.md 5.2準拠）
// 年表イベントは個別公開ページを持たない（BR-DOM-003）ため、Slugの入力対象には含めない。
export const timelineEventFormSchema = z.object({
  event_date: z.string().min(1, "日付を入力してください"),
  date_precision: z.enum(["year", "month", "day"]),
  category: z.enum([
    "model_launch",
    "engine_launch",
    "motorsport",
    "history",
    "other",
  ]),
  title: z.string().min(1, "タイトルを入力してください"),
  body: z.string().nullable(),
  related: z.array(relatedTargetSchema),
  // FR-SEO-001: SEOメタ情報（Title/Description/OGP画像/canonical URL）。編集画面でのみ入力対象とする
  seo: seoFormFieldsSchema.optional(),
});

export type TimelineEventFormValues = z.infer<typeof timelineEventFormSchema>;

export const emptyTimelineEventFormValues: TimelineEventFormValues = {
  event_date: "",
  date_precision: "year",
  category: "model_launch",
  title: "",
  body: "",
  related: [],
};

export const timelineCategoryLabels: Record<string, string> = {
  model_launch: "モデル登場",
  engine_launch: "エンジン登場",
  motorsport: "モータースポーツ",
  history: "歴史",
  other: "その他",
};

// SCR-PUB-010: カテゴリ別の色分け表示用
export const timelineCategoryColors: Record<string, string> = {
  model_launch: "bg-blue-600",
  engine_launch: "bg-amber-600",
  motorsport: "bg-red-600",
  history: "bg-neutral-600",
  other: "bg-purple-600",
};
