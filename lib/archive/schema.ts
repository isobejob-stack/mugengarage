import { z } from "zod";

// FR-OWN-002: オーナーズアーカイブ編集フォーム（table_definitions.md 7.1準拠）
export const ownerArchiveEntryFormSchema = z.object({
  restoration_history: z.string().nullable(),
  sales_history: z.string().nullable(),
  // 将来対応：入力欄のみ用意し、公開ページにはまだ表示しない（01_public_ui_spec.md 13章）
  owner_comment: z.string().nullable(),
  is_published: z.boolean(),
});

export type OwnerArchiveEntryFormValues = z.infer<
  typeof ownerArchiveEntryFormSchema
>;
