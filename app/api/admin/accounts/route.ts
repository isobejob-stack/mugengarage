import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { adminAccountCreateSchema } from "@/lib/auth/schema";
import {
  createAdminAccount,
  hasAdminProfile,
  listAdminAccounts,
} from "@/lib/auth/queries";

// FR-ADM-002: 管理アカウントの一覧・追加。
//
// ログイン済みの管理者なら誰でも別の管理者を追加できる。
// admin_users.role は将来の権限分けのために予約されているが、現時点では
// 全員が同じ権限で、階層を作っていない（運用者が2〜3人の店舗のため）。
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const accounts = await listAdminAccounts();
  return NextResponse.json({ data: accounts });
}

export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const json = await request.json().catch(() => null);
  const parsed = adminAccountCreateSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const result = await createAdminAccount(parsed.data);
  if (!result.ok) {
    return apiError({
      code: result.reason === "duplicate" ? "CONFLICT" : "VALIDATION_ERROR",
      message: result.message,
      field: result.reason === "duplicate" ? "email" : "password",
    });
  }

  // 操作した本人が admin_users に登録済みのときだけ監査ログを残す。
  // admin_user_id は admin_users への外部キーで、Supabaseの画面から直接作られた
  // ユーザーはこの行を持たないことがある。そのまま書くと外部キー違反になり、
  // recordAuditLog は結果を見ていないので記録だけが黙って落ちる。
  if (await hasAdminProfile(user.id)) {
    await recordAuditLog({
      adminUserId: user.id,
      targetType: "admin_user",
      targetId: result.account.id,
      action: "create",
      // パスワードは監査ログにも残さない
      changes: { name: result.account.name, email: result.account.email },
    });
  }

  return NextResponse.json({ data: result.account }, { status: 201 });
}
