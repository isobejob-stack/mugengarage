import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import {
  adminAccountEnabledSchema,
  adminAccountPasswordSchema,
} from "@/lib/auth/schema";
import {
  hasAdminProfile,
  listAdminAccounts,
  setAdminAccountEnabled,
  updateAdminAccountPassword,
} from "@/lib/auth/queries";

// FR-ADM-002: 管理アカウントのパスワード変更と、停止／再開。
//
// アカウントを消す口は用意していない。監査ログが操作者を参照しているため
// 実際には消せず、記録の観点でも消すべきではない（lib/auth/queries.ts 参照）。
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const json = await request.json().catch(() => null);

  const accounts = await listAdminAccounts();
  const targetAccount = accounts.find((a) => a.id === id);
  if (!targetAccount) {
    return apiError({
      code: "NOT_FOUND",
      message: "アカウントが見つかりません",
    });
  }

  const canRecordAudit = await hasAdminProfile(user.id);

  // 停止／再開
  const enabledInput = adminAccountEnabledSchema.safeParse(json);
  if (enabledInput.success) {
    const { enabled } = enabledInput.data;

    // 自分自身は止められない。止めた瞬間に自分が締め出され、
    // 元に戻すための画面にも入れなくなる。
    if (!enabled && id === user.id) {
      return apiError({
        code: "VALIDATION_ERROR",
        message:
          "自分のアカウントは停止できません。別の管理者にお願いしてください",
      });
    }

    // 全員を止めると誰も管理画面に入れなくなり、
    // 復旧にSupabaseのSQL Editorが必要になる（店主だけでは戻せない）。
    if (!enabled && accounts.filter((a) => a.enabled).length <= 1) {
      return apiError({
        code: "VALIDATION_ERROR",
        message: "使えるアカウントが1つだけのため停止できません",
      });
    }

    const result = await setAdminAccountEnabled(id, enabled);
    if (!result.ok) {
      return apiError({
        code: "INTERNAL_ERROR",
        message: result.message ?? "変更できませんでした",
      });
    }

    if (canRecordAudit) {
      await recordAuditLog({
        adminUserId: user.id,
        targetType: "admin_user",
        targetId: id,
        action: "update",
        changes: { enabled },
      });
    }

    return NextResponse.json({ data: { id, enabled } });
  }

  // パスワード変更
  const passwordInput = adminAccountPasswordSchema.safeParse(json);
  if (!passwordInput.success) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: passwordInput.error.issues[0].message,
      field: "password",
    });
  }

  const result = await updateAdminAccountPassword(id, passwordInput.data.password);
  if (!result.ok) {
    return apiError({
      code: "INTERNAL_ERROR",
      message: result.message ?? "パスワードを変更できませんでした",
    });
  }

  if (canRecordAudit) {
    await recordAuditLog({
      adminUserId: user.id,
      targetType: "admin_user",
      targetId: id,
      action: "update",
      // 何を変えたかだけ残す。パスワードそのものは記録しない。
      changes: { password: "変更しました" },
    });
  }

  return NextResponse.json({ data: { id } });
}
