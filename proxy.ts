import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// テスト公開時のみサイト全体をBasic認証で限定公開にする。
// BASIC_AUTH_USER/BASIC_AUTH_PASSWORD が未設定（本番環境）の場合は何もしない＝通常通り誰でも閲覧できる。
// 検索エンジンにも認証なしでは到達できないため、robots.txt/sitemapの設定は変更不要。
function isAuthorized(request: NextRequest): boolean {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;
  if (!expectedUser || !expectedPassword) return true;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  const decoded = atob(header.slice("Basic ".length));
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return false;

  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  return user === expectedUser && password === expectedPassword;
}

// Next.js 16: middleware.ts は proxy.ts に改名された（node_modules/next/dist/docs
// 01-app/02-guides/upgrading/version-16.md「middleware to proxy」）。
export async function proxy(request: NextRequest) {
  if (!isAuthorized(request)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: {
        "WWW-Authenticate":
          'Basic realm="M-GARAGE (limited access)", charset="UTF-8"',
      },
    });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
