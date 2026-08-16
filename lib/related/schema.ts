import { z } from "zod";

// 整備実績（maintenance_record）はブログへ統合したため、新規の紐付け先からは外した（2026-08-17）。
// 既存データに残る maintenance_record の行は lib/related/queries.ts が除外するので、
// このenumに戻す必要はない（enumに残すと管理画面の候補として復活してしまう）。
export const relatedTargetSchema = z.object({
  type: z.enum(["vehicle", "article", "encyclopedia_entry", "library_entry"]),
  id: z.string().uuid(),
});

// Record<string, string> のままにしてあるのは、DBに残る未知の種別を引いても
// 型エラーではなく undefined として扱えるようにするため
export const relatedContentTypeLabels: Record<string, string> = {
  vehicle: "車両",
  article: "ブログ記事",
  encyclopedia_entry: "図鑑",
  library_entry: "ライブラリ",
};
