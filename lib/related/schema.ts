import { z } from "zod";

export const relatedTargetSchema = z.object({
  type: z.enum([
    "vehicle",
    "article",
    "encyclopedia_entry",
    "library_entry",
    "maintenance_record",
  ]),
  id: z.string().uuid(),
});

export const relatedContentTypeLabels: Record<string, string> = {
  vehicle: "車両",
  article: "ブログ記事",
  encyclopedia_entry: "図鑑",
  library_entry: "ライブラリ",
  maintenance_record: "整備実績",
};
