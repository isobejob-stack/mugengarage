import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Supabase Authのセッションをリクエストごとに検証・更新し、
// /admin/* への未認証アクセスをログイン画面へリダイレクトする
// （authentication.md 4章: /admin/* は認証必須、未ログイン時はログイン画面へリダイレクト）。
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
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
  // 管理画面・APIルートは対象外とし、公開ページのみDBアクセスを発生させる（パフォーマンス配慮）。
  const isRedirectCandidate = !isAdminRoute && !pathname.startsWith("/api");

  if (isRedirectCandidate) {
    const supabase = createAdminClient();
    const { data: redirect } = await supabase
      .from("redirects")
      .select("new_path")
      .eq("old_path", pathname)
      .maybeSingle();

    if (redirect) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = redirect.new_path;
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
