import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// パスワード再設定メールのリンク先。Supabase Authが `?code=` を付けて
// ここへ戻してくるので、コードをセッションに交換してから目的の画面へ送る
// （authentication.md 7章 パスワードリセット）。
//
// 交換に成功した時点で回復用セッションが確立され、遷移先の /admin/reset-password は
// proxy.ts の認証チェックを通過できるようになる。リンクを持たない第三者は
// セッションを得られないため、再設定画面自体が認証必須のままで良い。

// オープンリダイレクト対策: 自サイト内の絶対パスだけを遷移先として許可する。
// `//example.com` はプロトコル相対URLとして外部に飛ぶため弾く。
function toSafePath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }
  return next;
}

// nextUrlを複製してパスだけ差し替える（lib/supabase/middleware.ts と同じ方式）。
// Vercelのプレビュー環境でもリクエストのホストがそのまま維持される。
function redirectTo(
  request: NextRequest,
  pathname: string,
  searchParams?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = toSafePath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    return redirectTo(request, "/admin/forgot-password", {
      notice: "invalid_link",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // 有効期限切れ・使用済み・別ブラウザで開いた場合はここに来る
    return redirectTo(request, "/admin/forgot-password", {
      notice: "expired_link",
    });
  }

  return redirectTo(request, next);
}
