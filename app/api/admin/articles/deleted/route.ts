import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { listDeletedArticles } from "@/lib/content/queries";

// ISSUE-004課題1 / BR-DEL-002: 論理削除された記事の一覧（管理画面の「削除済み」タブ用）
export async function GET(_request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const articles = await listDeletedArticles();
  return NextResponse.json({ data: articles });
}
