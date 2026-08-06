import { z } from "zod";
import { seoFormFieldsSchema } from "@/lib/seo/schema";

// FR-BLOG-001〜004: ブログ記事の入力スキーマ（table_definitions.md 6.1準拠）
export const articleFormSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .regex(/^[a-z0-9-]+$/, "半角英数字とハイフンのみ使用できます"),
  body: z.string().min(1, "本文を入力してください"),
  status: z.enum(["draft", "published"]),
  category: z.string().nullable(),
  scheduled_publish_at: z.string().nullable(),
  // FR-BLOG-002: タグ付け（BR-DATA-003: ハードコードせず管理画面から追加できるマスタデータとして管理する）
  tags: z.array(z.string().uuid()),
  // FR-BLOG-005: SEOメタ情報（Title/Description/OGP画像/canonical URL）。編集画面でのみ入力対象とする
  seo: seoFormFieldsSchema.optional(),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

export const emptyArticleFormValues: ArticleFormValues = {
  title: "",
  slug: "",
  body: "",
  status: "draft",
  category: null,
  scheduled_publish_at: null,
  tags: [],
};

// タイトルからslugを自動提案する（管理者は編集可能、BR-URL-001の永続化方針を尊重し
// 一度保存されたslugを勝手に上書きしない＝新規作成時のみ使用する）
export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
