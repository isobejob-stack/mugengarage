import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { findRedirect } from "@/lib/seo/redirect-lookup";

// Supabase Authのセッションをリクエストごとに検証・更新し、
// /admin/* への未認証アクセスをログイン画面へリダイレクトする
// （authentication.md 4章: /admin/* は認証必須、未ログイン時はログイン画面へリダイレクト）。

// Supabase Authがブラウザに置くCookieの接頭辞。
// @supabase/ssr は `sb-<project-ref>-auth-token` の形で発行する。
const SUPABASE_AUTH_COOKIE_PREFIX = "sb-";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith(SUPABASE_AUTH_COOKIE_PREFIX));
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  // 公開ページを見に来た一般の来訪者は、そもそもSupabaseの認証Cookieを持たない。
  // Cookieが無ければセッションの検証・更新にできることは何も無いので、
  // クライアントの生成ごと省く（getUser()は必ずnullを返す）。
  // 認証が要る/admin/*では、Cookieが無くてもログイン画面へ送る判定が必要なので通す。
  const needsAuthCheck = isAdminRoute || hasSupabaseAuthCookie(request);

  let response = NextResponse.next({ request });
  let user: User | null = null;

  if (needsAuthCheck) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    ({
      data: { user },
    } = await supabase.auth.getUser());
  }

  // 未ログインでも到達できる必要がある管理画面のパス。
  // /admin/reset-password は含めない: パスワード再設定メールのリンクを踏むと
  // /api/auth/callback で回復用セッションが確立されるため、認証必須のままで到達できる
  // （リンクを持たない第三者は到達できない、authentication.md 7章）。
  const isPublicAdminRoute =
    pathname === "/admin/login" || pathname === "/admin/forgot-password";

  if (isAdminRoute && !isPublicAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  // Engagement Context: 会員登録機能がないため匿名セッションIDでお気に入りを管理する
  // （FR-FAV-001, table_definitions.md 9.1）。未発行の訪問者には発行して1年保持する。
  if (!request.cookies.get("mg_session_id")) {
    response.cookies.set("mg_session_id", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  // FR-SEO-003 / BR-URL-002 / event_flow.md 3.7:
  // redirectsテーブルを参照し、旧URLへのアクセスを新URLへ301リダイレクトする。
  // 管理画面・APIルートは対象外とし、公開ページのみ引き当てる。
  //
  // 引き当ては lib/seo/redirect-lookup.ts のインメモリキャッシュ越しに行う。
  // 以前はここで毎リクエストSupabaseへ問い合わせており、ほぼ必ず空振りする検索のために
  // サイトの全アクセスへDB1往復ぶんの待ち時間が乗っていた。
  const isRedirectCandidate = !isAdminRoute && !pathname.startsWith("/api");

  if (isRedirectCandidate) {
    const newPath = await findRedirect(pathname);

    if (newPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = newPath;
      const redirectResponse = NextResponse.redirect(redirectUrl, 301);
      // 既存ロジックで発行されたCookie（Supabase認証セッション・mg_session_id）を引き継ぐ
      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie);
      }
      return redirectResponse;
    }
  }

  return response;
}
