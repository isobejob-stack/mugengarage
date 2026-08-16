import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { LIVE_EDIT_COOKIE } from "@/lib/live-edit/context";

// ライブ編集モードの入切。
//
// 公開ページのどの階層のコンポーネントからも「今は編集モードか」を知る必要があるため、
// クエリパラメータではなくCookieで持つ（全ページ・全コンポーネントに引数を配って回らずに済む）。
//
// このCookie単体では何の権限も与えない。公開ページ側は
// 「Cookieがある」かつ「管理者としてログインしている」の両方が揃ったときだけ
// 編集の目印を出す（lib/live-edit/context.ts）。保存APIも別途ログインを検証する。
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function POST() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const response = NextResponse.json({ data: { live_edit: true } });
  response.cookies.set(LIVE_EDIT_COOKIE, "1", {
    ...COOKIE_OPTIONS,
    // 消し忘れても翌日には戻るようにしておく。
    // 編集モードのまま公開サイトを見続けると、来店客に見えている画面を確認できない。
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function DELETE() {
  // 抜ける操作はログインを要求しない。
  // 何かの拍子にCookieだけが残った利用者が、自力で元に戻せなくなるのを避ける。
  const response = NextResponse.json({ data: { live_edit: false } });
  response.cookies.set(LIVE_EDIT_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
