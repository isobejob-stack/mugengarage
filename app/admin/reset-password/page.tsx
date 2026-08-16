import { AuthCard } from "@/components/admin/auth-card";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

// SCR-ADM-001付随: 新しいパスワードの設定（authentication.md 7章）。
// 到達には /api/auth/callback で確立される回復用セッションが必要なため、
// proxy.ts の認証必須ルート（= 公開パスの例外に含めない）のままとする。
export default function Page() {
  return (
    <AuthCard
      title="新しいパスワードの設定"
      description="新しいパスワードを入力してください。変更後はそのまま管理画面に入れます。"
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
