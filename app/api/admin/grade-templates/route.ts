import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import {
  gradeTemplateFormSchema,
  listGradeTemplates,
  upsertGradeTemplate,
  deleteGradeTemplate,
} from "@/lib/inventory/templates";

// FR-ADM-004: グレード別テンプレート一覧（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  return NextResponse.json({ data: await listGradeTemplates() });
}

// FR-ADM-004: テンプレートの保存。
// grade_id が UNIQUE なので新規・更新を作り分けず、常にupsertする。
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const json = await request.json().catch(() => null);
  const parsed = gradeTemplateFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const { data, error } = await upsertGradeTemplate(parsed.data);
  if (error || !data) return apiInternalError(error);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "grade_template",
    targetId: data.id,
    action: "update",
  });

  return NextResponse.json({ data });
}

// FR-ADM-004: テンプレートの削除。
// 補助データであり履歴を残す必要がないため物理削除する（BR-DEL-001の例外）。
// 消しても、既に車両に入力済みの文章はそのまま残る。
export async function DELETE(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { searchParams } = new URL(request.url);
  const gradeId = searchParams.get("grade_id");
  if (!gradeId) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "グレードが指定されていません",
      field: "grade_id",
    });
  }

  const { error } = await deleteGradeTemplate(gradeId);
  if (error) return apiInternalError(error);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "grade_template",
    targetId: gradeId,
    action: "delete",
  });

  return NextResponse.json({ data: { grade_id: gradeId } });
}
