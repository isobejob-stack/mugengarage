import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { deleteTag, getTagById } from "@/lib/tags/queries";

// FR-INV-012 / FR-BLOG-002: タグ削除。
// tagsテーブルはdeleted_atカラムを持たない設計（BR-DEL-001が対象とする車両・記事等の
// 主要データとは異なり、tags/taggingsは分類マスタ・ポリモーフィックな中間テーブルであるため）。
// 物理削除とし、紐付くtaggingsも合わせて削除する（lib/tags/queries.tsのdeleteTag参照）。
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const existing = await getTagById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "タグが見つかりません" });
  }

  const { data: tag, error } = await deleteTag(id);
  if (error || !tag) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "tag",
    targetId: id,
    action: "delete",
  });

  return NextResponse.json({ data: tag });
}
