import { z } from "zod";

// 管理アカウントの追加・パスワード変更で使う入力検証（FR-ADM-002）。
//
// 従来、管理者を増やすにはSupabaseのダッシュボードで
// 「Authenticationでユーザーを作る → UIDをコピー → SQL Editorで admin_users にINSERT」
// という3段階の作業が必要だった（supabase/reset-admin-password.sql の補足B）。
// 店主本人がこれを行うのは現実的でないため、管理画面から追加できるようにする。

// パスワードの下限。
// この管理画面の向こうには顧客の氏名・電話番号・メールアドレスがあり、
// サービスロールキーで動くAPIが並んでいる。Supabaseの既定（6文字）では短すぎる。
// 覚えやすさは「自動で作る」ボタン側で担保し、下限そのものは緩めない。
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

const passwordField = z
  .string()
  .min(
    ADMIN_PASSWORD_MIN_LENGTH,
    `パスワードは${ADMIN_PASSWORD_MIN_LENGTH}文字以上で入力してください`,
  )
  .max(72, "パスワードは72文字以内で入力してください");

export const adminAccountCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
  // メールアドレスはログインIDそのもの。前後の空白と大文字小文字で
  // 「登録したのにログインできない」が起きるため、ここで揃えてから保存する。
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
  password: passwordField,
});

export const adminAccountPasswordSchema = z.object({
  password: passwordField,
});

// アカウントを止める／使えるように戻す。
// 削除ではなく停止にしている理由は lib/auth/queries.ts の setAdminAccountEnabled を参照。
export const adminAccountEnabledSchema = z.object({
  enabled: z.boolean(),
});

export type AdminAccountCreateValues = z.infer<typeof adminAccountCreateSchema>;
