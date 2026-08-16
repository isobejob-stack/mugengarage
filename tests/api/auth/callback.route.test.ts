import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// 対象は app/api/auth/callback/route.ts の GET ハンドラ。
// パスワード再設定メールのリンク着地点であり、ここで回復用セッションが確立される
// （authentication.md 7章）。次の2点を担保する:
//   - 遷移先(next)は自サイト内の絶対パスに限定する（オープンリダイレクト対策）
//   - コードが無い／交換に失敗した場合は再送信画面へ理由付きで戻す
//
// モック方針: 実際のSupabaseには接続せず、`createClient` が返すクライアントの
// auth.exchangeCodeForSession のみをフェイクにする。

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession },
  })),
}));

const { GET } = await import("@/app/api/auth/callback/route");

const ORIGIN = "https://example.com";

function callbackRequest(query: string) {
  return new NextRequest(`${ORIGIN}/api/auth/callback${query}`);
}

function locationOf(response: Response) {
  return new URL(response.headers.get("location") ?? "");
}

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe("GET /api/auth/callback", () => {
  it("コードが無い場合はセッション交換せず、理由付きで再送信画面へ戻す", async () => {
    const response = await GET(callbackRequest("?next=/admin/reset-password"));
    const location = locationOf(response);

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(location.pathname).toBe("/admin/forgot-password");
    expect(location.searchParams.get("notice")).toBe("invalid_link");
  });

  it("セッション交換に失敗した場合は期限切れとして再送信画面へ戻す", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });

    const response = await GET(
      callbackRequest("?code=abc&next=/admin/reset-password"),
    );
    const location = locationOf(response);

    expect(location.pathname).toBe("/admin/forgot-password");
    expect(location.searchParams.get("notice")).toBe("expired_link");
  });

  it("セッション交換に成功した場合は指定された遷移先へ送る", async () => {
    const response = await GET(
      callbackRequest("?code=abc&next=%2Fadmin%2Freset-password"),
    );
    const location = locationOf(response);

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc");
    expect(location.origin).toBe(ORIGIN);
    expect(location.pathname).toBe("/admin/reset-password");
    expect(location.searchParams.get("notice")).toBeNull();
  });

  it("nextが未指定の場合は管理画面トップへ送る", async () => {
    const response = await GET(callbackRequest("?code=abc"));

    expect(locationOf(response).pathname).toBe("/admin");
  });

  // オープンリダイレクト対策: 外部サイトへ誘導されないことを担保する
  it.each([
    ["プロトコル相対URL", "//evil.example.net/phishing"],
    ["絶対URL", "https://evil.example.net/phishing"],
    ["相対パス", "admin/reset-password"],
  ])("nextが%s（%s）の場合は管理画面トップへ握り潰す", async (_label, next) => {
    const response = await GET(
      callbackRequest(`?code=abc&next=${encodeURIComponent(next)}`),
    );
    const location = locationOf(response);

    expect(location.origin).toBe(ORIGIN);
    expect(location.pathname).toBe("/admin");
  });
});
