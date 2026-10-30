import { z } from "zod";

// FR-OWN-002: オーナーズアーカイブ編集フォーム（table_definitions.md 7.1準拠）
export const ownerArchiveEntryFormSchema = z.object({
  restoration_history: z.string().nullable(),
  sales_history: z.string().nullable(),
  // FR-OWN-004: 公開ページに「オーナーの声」として表示する（本人の許可を得た内容のみ、BR-CONTENT-003）
  owner_comment: z.string().nullable(),
  is_published: z.boolean(),
});

export type OwnerArchiveEntryFormValues = z.infer<
  typeof ownerArchiveEntryFormSchema
>;
