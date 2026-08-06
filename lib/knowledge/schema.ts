import { z } from "zod";

// FR-ENC-001: 図鑑項目の入力スキーマ（table_definitions.md 5.1準拠）
export const encyclopediaEntryFormSchema = z.object({
  category: z.enum([
    "brand",
    "series",
    "model",
    "generation",
    "engine",
    "technology",
    "history",
    "term",
  ]),
  parent_id: z.string().uuid().nullable(),
  title: z.string().min(1, "タイトルを入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .regex(/^[a-z0-9-]+$/, "半角英数字とハイフンのみ使用できます"),
  body: z.string().min(1, "本文を入力してください"),
});

export type EncyclopediaEntryFormValues = z.infer<
  typeof encyclopediaEntryFormSchema
>;

export const emptyEncyclopediaEntryFormValues: EncyclopediaEntryFormValues = {
  category: "term",
  parent_id: null,
  title: "",
  slug: "",
  body: "",
};

export const encyclopediaCategoryLabels: Record<string, string> = {
  brand: "ブランド",
  series: "シリーズ",
  model: "車種",
  generation: "世代",
  engine: "エンジン",
  technology: "技術",
  history: "歴史",
  term: "用語集",
};
