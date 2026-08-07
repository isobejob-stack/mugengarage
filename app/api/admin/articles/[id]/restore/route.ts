import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { getDeletedArticleById, restoreArticle } from "@/lib/content/queries";

// ISSUE-004課題1 / BR-DEL-002: 論理削除された記事の復元（deleted_atをnullに戻す）
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getDeletedArticleById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "論理削除された記事が見つかりません",
    });
  }

  const { data: article, error } = await restoreArticle(id);
  if (error || !article) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "article",
    targetId: id,
    action: "restore",
  });

  return NextResponse.json({ data: article });
}
