import { redirect } from "next/navigation";
import { getAdminAccessState } from "@/lib/api/require-admin";
import { AdminNav } from "@/components/layout/admin-nav";

// proxy.ts（旧middleware.ts相当）でも未認証リダイレクトを行うが、
// フロント制御だけに頼らない多層防御としてServer Component側でも検証する
// （authentication.md 8章）。
//
// 見るのは「ログインできたか」ではなく「管理者として登録されているか」。
// Supabase Authにユーザーが居るだけでは通さない（lib/api/require-admin.ts）。
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAdminAccessState();

  if (access === "anonymous") {
    redirect("/admin/login");
  }

  // ログインはできているが admin_users に登録がない状態。
  // 黙ってログイン画面へ戻すと「ログインできたのに戻される」だけになり、
  // 本人には原因が分からないため、理由を伝えられる形で送る。
  if (access === "not_admin") {
    redirect("/admin/login?notice=not_admin");
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      <AdminNav />
      {children}
    </div>
  );
}
