import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { listDeletedLibraryEntries } from "@/lib/library/queries";

// ISSUE-004課題1 / BR-DEL-002: 論理削除されたライブラリ項目の一覧（管理画面の「削除済み」タブ用）
export async function GET(_request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const entries = await listDeletedLibraryEntries();
  return NextResponse.json({ data: entries });
}
