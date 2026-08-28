import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminAccountCreateValues } from "@/lib/auth/schema";

// 管理アカウントの読み書き（FR-ADM-002）。
//
// 管理者は「Supabase Authのユーザー（ログイン情報）」と
// 「admin_usersの行（表示名）」の2つが揃って初めて成立する。
// 片方だけ作るとログインできる／できないの中途半端な状態になるため、
// 作成・削除は必ずこのモジュールを通し、両方をまとめて扱う。
//
// auth.users はSQLからは触れず、サービスロールキーの管理APIを使う
// （パスワードのハッシュ方式をSupabaseと合わせる必要があるため）。

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  /** 一度もログインしていなければ null */
  last_sign_in_at: string | null;
  created_at: string;
  /** false のあいだはログインできない（停止中）。停止は取り消せる */
  enabled: boolean;
};

// アカウントを止めるときにSupabaseへ渡す期間。
// 「無期限に止める」という指定が無いため、実質的に戻ってこない長さを入れる。
const DISABLE_DURATION = "876000h"; // 約100年

// 管理アカウント一覧。
// auth.users（メールアドレス・最終ログイン）と admin_users（表示名）を突き合わせる。
export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const supabase = createAdminClient();

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    // 管理者は多くても数人。1ページに収まる上限で読み切る。
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase.from("admin_users").select("id, name, role, created_at"),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      p as { id: string; name: string; role: string; created_at: string },
    ]),
  );

  return (authData?.users ?? [])
    .map((user) => {
      const profile = profileById.get(user.id);
      // banned_until は停止の解除後も過去日として残ることがあるため、
      // 「値がある」ではなく「まだ先の日付か」で判定する。
      const bannedUntil = (user as { banned_until?: string | null })
        .banned_until;
      return {
        id: user.id,
        // admin_users に行が無いユーザー（Supabaseの画面から直接作られた等）も隠さず出す。
        // 隠すと「作ったはずのアカウントが一覧に出ない」という調べようのない状態になる。
        name: profile?.name ?? "（名前が未登録）",
        email: user.email ?? "",
        role: profile?.role ?? "admin",
        last_sign_in_at: user.last_sign_in_at ?? null,
        created_at: profile?.created_at ?? user.created_at,
        enabled: !bannedUntil || new Date(bannedUntil) <= new Date(),
      };
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export type CreateAdminAccountResult =
  | { ok: true; account: AdminAccount }
  | {
      ok: false;
      reason: "duplicate" | "weak_password" | "unknown";
      message: string;
    };

// 管理アカウントを作る。
//
// ログイン情報 → 表示名 の順に作り、表示名の作成に失敗したらログイン情報も消す。
// 途中で失敗したまま放置すると「ログインはできるが管理者として扱われない」
// アカウントが残り、本人には原因がまったく分からない状態になる。
export async function createAdminAccount(
  values: AdminAccountCreateValues,
): Promise<CreateAdminAccountResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: values.email,
    password: values.password,
    // 確認メールを送らずに使える状態にする。
    // 店主が父のアカウントをその場で作って手渡す使い方を想定しており、
    // 受信箱を開かせる手順を挟むと、そこで詰まったときに誰も先に進めない。
    email_confirm: true,
  });

  if (error || !data.user) {
    const message = error?.message ?? "";
    if (/already been registered|already exists|duplicate/i.test(message)) {
      return {
        ok: false,
        reason: "duplicate",
        message: "このメールアドレスはすでに登録されています",
      };
    }
    if (/password/i.test(message)) {
      return {
        ok: false,
        reason: "weak_password",
        message: "パスワードが条件を満たしていません。別のものをお試しください",
      };
    }
    return {
      ok: false,
      reason: "unknown",
      message: "アカウントを作成できませんでした",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_users")
    .insert({ id: data.user.id, name: values.name })
    .select("id, name, role, created_at")
    .single();

  if (profileError || !profile) {
    // 表示名の登録に失敗した時点で、このログイン情報は使い道が無い。
    // 消しておかないと、同じメールアドレスで作り直すこともできなくなる。
    await supabase.auth.admin.deleteUser(data.user.id);
    return {
      ok: false,
      reason: "unknown",
      message: "アカウントを作成できませんでした",
    };
  }

  return {
    ok: true,
    account: {
      id: profile.id,
      name: profile.name,
      email: values.email,
      role: profile.role,
      last_sign_in_at: null,
      created_at: profile.created_at,
      enabled: true,
    },
  };
}

// パスワードを変更する。本人が忘れたときに、もう一人の管理者が再設定できるようにする
// （従来はSupabaseのSQL Editorで crypt() を書くしかなかった）。
export async function updateAdminAccountPassword(
  id: string,
  password: string,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, { password });

  if (error) {
    return { ok: false, message: "パスワードを変更できませんでした" };
  }
  return { ok: true };
}

// アカウントを止める／使えるように戻す。
//
// 「削除」ではなく「停止」にしているのは、消せないからでもあり、消すべきでないからでもある。
//   - 消せない: admin_users は auth.users への on delete cascade だが、
//     audit_logs.admin_user_id が admin_users を参照していて削除を止める。
//     一度でも操作した管理者は、消そうとすると外部キー違反で失敗し、
//     画面には理由の分からないエラーだけが出ることになる。
//   - 消すべきでない: 監査ログは「誰がいつ何をしたか」の記録（BR-HIST-002）で、
//     アカウントを消して操作者が辿れなくなるのは記録として本末転倒になる。
//
// 停止したアカウントはログインできなくなるだけで、いつでも戻せる。
export async function setAdminAccountEnabled(
  id: string,
  enabled: boolean,
): Promise<{ ok: boolean; message?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: enabled ? "none" : DISABLE_DURATION,
  });

  if (error) {
    return {
      ok: false,
      message: enabled
        ? "アカウントを再開できませんでした"
        : "アカウントを停止できませんでした",
    };
  }
  return { ok: true };
}

// 監査ログに残せる管理者かどうか。
//
// audit_logs.admin_user_id は admin_users への外部キーで、
// Supabaseの画面から直接作られたユーザーはこの行を持たないことがある。
// その状態で監査ログを書こうとすると外部キー違反で記録だけが黙って落ちるため、
// 記録側が「管理者として登録済みか」を確認できるようにしておく。
export async function hasAdminProfile(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  return Boolean(data);
}
