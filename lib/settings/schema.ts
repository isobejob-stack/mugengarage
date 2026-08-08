import { z } from "zod";

// 店舗情報・外部リンクは管理画面から編集する（BR-DATA-003 の「ハードコードしない」方針を、
// 店舗プロフィールにも適用する）。docs/tasks/ISSUE-005 参照。

// 未入力欄はフォームから空文字で送られてくる。DB上は「未設定＝NULL」で統一したいので、
// 空文字をnullへ正規化する。これにより表示側は「値があるか」だけを見れば済む。
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}は${max}文字以内で入力してください`)
    .transform((value) => (value === "" ? null : value))
    .nullable();

// httpsのURLのみ許可する。httpや任意文字列を許すと、掲載媒体リンクが
// そのまま公開サイトの外部リンクとして出力されるため、最低限の形式検証を行う。
const optionalUrl = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .refine(
      (value) => value === null || /^https:\/\/.+/.test(value),
      `${label}は https:// から始まるURLを入力してください`,
    );

export const externalLinkSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "リンク名を入力してください")
    .max(50, "リンク名は50文字以内で入力してください"),
  url: z
    .string()
    .trim()
    .min(1, "URLを入力してください")
    .regex(/^https:\/\/.+/, "https:// から始まるURLを入力してください"),
  description: z
    .string()
    .trim()
    .max(100, "説明は100文字以内で入力してください")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});

export const siteSettingsFormSchema = z.object({
  postal_code: optionalText(10, "郵便番号"),
  address: optionalText(200, "住所"),
  phone: optionalText(20, "電話番号"),
  business_hours: optionalText(100, "営業時間"),
  closed_days: optionalText(100, "定休日"),
  // 創業年。空欄可。範囲は現実的な値に限定して打ち間違いを弾く
  founded_year: z
    .union([z.string(), z.number()])
    .transform((value) =>
      value === "" || value === null ? null : Number(value),
    )
    .nullable()
    .refine(
      (value) =>
        value === null ||
        (Number.isInteger(value) && value >= 1900 && value <= 2100),
      "創業年は1900〜2100の範囲で入力してください",
    ),
  representative_name: optionalText(50, "代表者名"),
  access_info: optionalText(500, "アクセス"),
  // 最重要CTAの遷移先。未設定のあいだは画面側でLINEボタンを出さない
  line_url: optionalUrl("LINEのURL"),
  external_links: z.array(externalLinkSchema).max(20, "リンクは20件までです"),
});

export type SiteSettingsFormValues = z.input<typeof siteSettingsFormSchema>;
export type SiteSettingsValues = z.output<typeof siteSettingsFormSchema>;
export type ExternalLink = z.infer<typeof externalLinkSchema>;

// フォームの初期値。DBの値が無い場合でもフォームを描画できるようにする。
export const emptySiteSettingsFormValues: SiteSettingsFormValues = {
  postal_code: "",
  address: "",
  phone: "",
  business_hours: "",
  closed_days: "",
  founded_year: "",
  representative_name: "",
  access_info: "",
  line_url: "",
  external_links: [],
};
