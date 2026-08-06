import { z } from "zod";

// FR-INV-012 / FR-BLOG-002 / BR-DATA-003:
// タグはハードコードせず、管理画面から追加・編集可能なマスタデータとして管理する。
export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "タグ名を入力してください")
    .max(50, "タグ名は50文字以内で入力してください"),
  slug: z
    .string()
    .trim()
    .min(1, "スラッグを入力してください")
    .regex(/^[a-z0-9-]+$/, "半角英数字とハイフンのみ使用できます"),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

// タグ名からslugを自動提案する（lib/content/schema.tsのslugifyと同様のロジック）。
// SEO/Meta ContextはコンテンツContextに依存しない独立した仕組みとするため、
// ここでは共有せず同一ロジックを個別に持つ（bounded_context.md 5章の依存方向を尊重）。
// 半角英数字以外は失われるため、日本語のタグ名では空文字になり得る。
// その場合は呼び出し側（フォーム）で管理者が保存前に手動修正する想定。
export function slugifyTagName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
