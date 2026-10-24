import "server-only";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 管理系の入口で必ず呼ぶ認可チェック。
//
// 「ログインできたか（認証）」と「管理者か（認可）」は別の問いである。
// 以前ここは前者だけを見ており、Supabase Authのセッションを持っていれば
// 誰でも管理APIを通過できた。匿名キーはブラウザに配る公開値なので、
// Supabaseプロジェクト側でサインアップが有効なら、第三者が自分で登録して
// 顧客の氏名・電話番号・メールアドレスを読み書きできる状態だった。
// しかも audit_logs.admin_user_id は admin_users への外部キーなので、
// その操作は記録にも残らない（挿入が外部キー違反で落ちる）。
//
// 認可の根拠は admin_users テーブルに行があることとする。
// この表に載るのは、店主が管理画面から追加した人だけ（/admin/accounts）。
// auth.users に居るだけでは管理者とみなさない。
//
// admin_users は RLS 有効・ポリシー未定義のため匿名キーからは読めない。
// サービスロールキー側のクライアントで引く（docs/tasks/ISSUE-002）。
async function fetchAdminProfile(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, name, role")
    .eq("id", userId)
    .maybeSingle();

  // 取得に失敗したときは管理者とみなさない。
  // 「エラーなら通す」に倒すと、DB障害がそのまま認可の迂回路になる。
  if (error) return null;
  return data as { id: string; name: string; role: string } | null;
}

export type AdminIdentity = {
  user: User;
  profile: { id: string; name: string; role: string };
};

// いまのリクエストの管理者情報。管理者でなければ null。
//
// 1回の描画で複数の画面・ヘルパから呼ばれるため、
// React の cache() でリクエスト内の重複問い合わせを1回に畳む。
export const getAdminIdentity = cache(
  async (): Promise<AdminIdentity | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await fetchAdminProfile(user.id);
    if (!profile) return null;

    return { user, profile };
  },
);

// ログイン自体はできているが、管理者として登録されていない状態かどうか。
//
// 画面側でこの2つを区別する必要がある。
//   - 未ログイン           → ログイン画面へ送る（いつもの動き）
//   - ログイン済み・非管理者 → 「管理者として登録されていません」と伝える
// 区別せずに同じ扱いにすると、ログインできたのにログイン画面へ戻されるだけで、
// 本人には理由がまったく分からない。
export async function getAdminAccessState(): Promise<
  "admin" | "not_admin" | "anonymous"
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "anonymous";
  return (await fetchAdminProfile(user.id)) ? "admin" : "not_admin";
}

// 管理系Route Handlerの入口で呼ぶ。
// 管理者でなければ null を返し、呼び出し側は401を返す。
export async function requireAdminUser(): Promise<User | null> {
  const identity = await getAdminIdentity();
  return identity?.user ?? null;
}
