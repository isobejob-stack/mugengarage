import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listAdminAccounts } from "@/lib/auth/queries";
import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager";

// FR-ADM-002: 管理アカウント。
// 店主のほかに、家族・スタッフが管理画面へ入れるようにするための画面。
export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // レイアウトでも検証しているが、ここでは「いまログインしているのは誰か」を
  // 画面に渡す必要がある（自分自身を停止させないため）。
  if (!user) redirect("/admin/login");

  const accounts = await listAdminAccounts();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        管理アカウント
      </h1>
      <p className="text-foreground-muted mt-2 text-base leading-relaxed">
        管理画面にログインできる人の一覧です。
        ここで追加した人は、車両の登録や記事の編集など、あなたと同じ操作ができます。
      </p>

      <AdminAccountsManager
        initialAccounts={accounts}
        currentUserId={user.id}
      />
    </main>
  );
}
