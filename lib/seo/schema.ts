import { z } from "zod";

// FR-SEO-001 / FR-INV-011 / FR-BLOG-005 / FR-ENC-004:
// 各コンテンツのPATCH APIが共通で受け付ける `seo` オブジェクトの入力スキーマ。
// structured_data（構造化データ）は自動生成のため手動編集対象に含めない。
// 空文字は「未設定に戻す」操作として扱い、nullへ変換する。
const emptyToNull = (value: unknown) => (value === "" ? null : value);

const nullableText = z.string().trim().nullable().optional();

const nullableUrl = z.preprocess(
  emptyToNull,
  z.string().trim().url("有効なURLを入力してください").nullable().optional(),
);

export const seoFieldsSchema = z.object({
  title: nullableText,
  description: nullableText,
  og_image_url: nullableUrl,
  canonical_url: nullableUrl,
});

export type SeoFieldsInput = z.infer<typeof seoFieldsSchema>;

// FR-SEO-001: 管理画面フォーム（react-hook-form）用のSEOフィールドスキーマ。
// 上のseoFieldsSchemaはz.preprocessでinput型とoutput型が異なり、zodResolverの型推論と相性が悪いため、
// クライアント側の入力検証は素朴なnullable文字列に留める。
// 空文字→null変換・URL妥当性検証は送信先のPATCH API（parseSeoInput/seoFieldsSchema）に委ねる。
export const seoFormFieldsSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
});

export type SeoFormFieldsValues = z.infer<typeof seoFormFieldsSchema>;

// FR-SEO-001: 管理画面フォームの初期値・未設定状態を表す共通の空値。
// react-hook-formのdefaultValues、およびSEO設定セクション未編集時のフォールバックとして使う。
export const emptySeoFieldsValues: SeoFormFieldsValues = {
  title: null,
  description: null,
  og_image_url: null,
  canonical_url: null,
};

// リクエストボディの `seo` を検証する。未指定（undefined/null）の場合はSEOメタの更新自体を行わない
// （既存のupsert対象と区別するため、成功扱いで data: undefined を返す）。
export function parseSeoInput(raw: unknown) {
  if (raw === undefined || raw === null) {
    return { success: true as const, data: undefined };
  }
  return seoFieldsSchema.safeParse(raw);
}

// FR-SEO-004: Slug入力の共通バリデーション（articles/encyclopedia_entries等の既存slugと同一ルール）
export const slugValueSchema = z
  .string()
  .trim()
  .min(1, "スラッグを入力してください")
  .regex(/^[a-z0-9-]+$/, "半角英数字とハイフンのみ使用できます");
