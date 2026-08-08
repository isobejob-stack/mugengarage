import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { siteSettingsFormSchema } from "@/lib/settings/schema";
import { getSiteSettings, updateSiteSettings } from "@/lib/settings/queries";

// 店舗情報・外部リンクの取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ data: settings });
}

// 店舗情報・外部リンクの更新。
// 住所や電話番号は公開サイトに直接出る情報であり、LINE URLは最重要CTAの遷移先のため、
// 誰がいつ変更したかを追えるよう監査ログを残す（BR-HIST-001）。
export async function PATCH(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  // 壊れたJSONを送られても500にせず、検証エラーとして返す
  const json = await request.json().catch(() => null);
  if (json === null) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "リクエストの形式が正しくありません",
    });
  }

  const parsed = siteSettingsFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const { data: settings, error } = await updateSiteSettings(parsed.data);

  if (error) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "site_setting",
    targetId: "singleton",
    action: "update",
  });

  return NextResponse.json({ data: settings });
}
