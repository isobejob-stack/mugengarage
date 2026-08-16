import { AuthCard } from "@/components/admin/auth-card";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

// 再設定リンクが無効だった場合に /api/auth/callback から ?notice= 付きで戻される。
// 文言はサーバー側で解決し、クライアントに任意の文字列を表示させない。
const NOTICES: Record<string, string> = {
  invalid_link:
    "リンクが正しくありません。お手数ですが、もう一度メールを送信してください。",
  expired_link:
    "リンクの有効期限が切れているか、すでに使用済みです。もう一度メールを送信してください。",
};

// SCR-ADM-001付随: パスワードを忘れた場合の再設定メール送信
// （authentication.md 7章, 02_admin_ui_spec.md 1章「パスワードを忘れた場合の案内」）
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return (
    <AuthCard
      title="パスワードの再設定"
      description="登録済みのメールアドレス宛に、再設定用のリンクをお送りします。"
    >
      <ForgotPasswordForm notice={notice ? NOTICES[notice] : undefined} />
    </AuthCard>
  );
}
