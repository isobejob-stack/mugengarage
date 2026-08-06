import { z } from "zod";
import { relatedTargetSchema } from "@/lib/related/schema";

// FR-LIB-001: ライブラリ項目の入力スキーマ（table_definitions.md 5.3準拠）
export const libraryEntryFormSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .regex(/^[a-z0-9-]+$/, "半角英数字とハイフンのみ使用できます"),
  reading_kana: z.string().nullable(),
  category: z.string().nullable(),
  body: z.string().min(1, "本文を入力してください"),
  related: z.array(relatedTargetSchema),
});

export type LibraryEntryFormValues = z.infer<typeof libraryEntryFormSchema>;

export const emptyLibraryEntryFormValues: LibraryEntryFormValues = {
  title: "",
  slug: "",
  reading_kana: "",
  category: "",
  body: "",
  related: [],
};

// FR-LIB-003: 五十音インデックス用の行分類（かな1文字目から判定）
const KANA_ROWS: Array<{ label: string; chars: string }> = [
  { label: "あ", chars: "あいうえお" },
  { label: "か", chars: "かきくけこがぎぐげご" },
  { label: "さ", chars: "さしすせそざじずぜぞ" },
  { label: "た", chars: "たちつてとだぢづでど" },
  { label: "な", chars: "なにぬねの" },
  { label: "は", chars: "はひふへほばびぶべぼぱぴぷぺぽ" },
  { label: "ま", chars: "まみむめも" },
  { label: "や", chars: "やゆよ" },
  { label: "ら", chars: "らりるれろ" },
  { label: "わ", chars: "わをん" },
];

export function kanaRowOf(readingKana: string | null): string {
  if (!readingKana) return "その他";
  const first = readingKana[0];
  const row = KANA_ROWS.find((r) => r.chars.includes(first));
  return row?.label ?? "その他";
}
