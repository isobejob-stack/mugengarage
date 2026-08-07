import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { modelFormSchema } from "@/lib/inventory/schema";
import { createModel } from "@/lib/inventory/queries";

// FR-INV-001 / BR-DATA-003:
// 車種の新規作成。メーカーと同様、車両登録フォームの「その他（手入力）」からその場で
// 追加できる管理画面のマスタデータとして管理する
// （app/api/admin/manufacturers/route.ts・app/api/admin/tags/route.tsと同じ実装パターン）。
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const json = await request.json();
  const parsed = modelFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();

  // models.manufacturer_idはmanufacturers(id)へのFK（NOT NULL）のため、
  // 事前に存在確認して分かりやすいVALIDATION_ERRORを返す（app/api/admin/vehicles/route.tsの
  // model_id存在チェックと同じパターン）。
  const { data: manufacturer } = await supabase
    .from("manufacturers")
    .select("id")
    .eq("id", parsed.data.manufacturer_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!manufacturer) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "選択されたメーカーが見つかりません",
      field: "manufacturer_id",
    });
  }

  const { data: model, error } = await createModel(parsed.data);

  if (error) {
    // models.slug のUNIQUE制約違反（メーカーをまたいでテーブル全体で一意）
    if (error.code === "23505") {
      return apiError({
        code: "CONFLICT",
        message: "同名またはスラッグが同じ車種が既に存在します",
        field: "name",
      });
    }
    return apiInternalError(error);
  }
  if (!model) {
    return apiInternalError(new Error("車種の作成に失敗しました"));
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "model",
    targetId: model.id,
    action: "create",
  });

  return NextResponse.json({ data: model }, { status: 201 });
}
