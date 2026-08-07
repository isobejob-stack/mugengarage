import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { manufacturerFormSchema } from "@/lib/inventory/schema";
import { createManufacturer } from "@/lib/inventory/queries";

// FR-INV-001 / BR-DATA-003:
// メーカーの新規作成。メーカーはハードコードせず、車両登録フォームの「その他（手入力）」から
// その場で追加できる管理画面のマスタデータとして管理する
// （app/api/admin/tags/route.tsのPOSTハンドラと同じ実装パターン）。
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const json = await request.json();
  const parsed = manufacturerFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const { data: manufacturer, error } = await createManufacturer(parsed.data);

  if (error) {
    // manufacturers.name / manufacturers.slug のUNIQUE制約違反
    if (error.code === "23505") {
      return apiError({
        code: "CONFLICT",
        message: "同名またはスラッグが同じメーカーが既に存在します",
        field: "name",
      });
    }
    return apiInternalError(error);
  }
  if (!manufacturer) {
    return apiInternalError(new Error("メーカーの作成に失敗しました"));
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "manufacturer",
    targetId: manufacturer.id,
    action: "create",
  });

  return NextResponse.json({ data: manufacturer }, { status: 201 });
}
