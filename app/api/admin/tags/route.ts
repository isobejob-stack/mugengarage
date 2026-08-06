import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { tagFormSchema } from "@/lib/tags/schema";
import { createTag, listTags } from "@/lib/tags/queries";

// FR-INV-012 / FR-BLOG-002: タグマスタ一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const tags = await listTags();
  return NextResponse.json({ data: tags });
}

// FR-INV-012 / FR-BLOG-002 / BR-DATA-003:
// タグの新規作成。タグはハードコードせず管理画面から追加・編集可能なマスタデータとして管理する。
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const json = await request.json();
  const parsed = tagFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const { data: tag, error } = await createTag(parsed.data);

  if (error) {
    // tags.name / tags.slug のUNIQUE制約違反
    if (error.code === "23505") {
      return apiError({
        code: "CONFLICT",
        message: "同名またはスラッグが同じタグが既に存在します",
        field: "name",
      });
    }
    return apiInternalError(error);
  }
  if (!tag) {
    return apiInternalError(new Error("タグの作成に失敗しました"));
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "tag",
    targetId: tag.id,
    action: "create",
  });

  return NextResponse.json({ data: tag }, { status: 201 });
}
