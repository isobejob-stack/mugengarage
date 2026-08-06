import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { listAdminRedirects } from "@/lib/seo/queries";

// FR-SEO-003（必須修正5）: リダイレクト一覧取得（管理用）。
// BR-URL-002（Slug変更時は必ず301リダイレクトを自動登録する）が実際に守られているかを、
// 運用者が確認できる手段が無かったため追加する。編集・削除機能は持たない（一覧参照のみ）。
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const redirects = await listAdminRedirects();
  return NextResponse.json({ data: redirects });
}
