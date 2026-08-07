import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/layout/admin-nav";

// proxy.ts（旧middleware.ts相当）でも未認証リダイレクトを行うが、
// フロント制御だけに頼らない多層防御としてServer Component側でも検証する
// （authentication.md 8章）。
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <AdminNav />
      {children}
    </div>
  );
}
