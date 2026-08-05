export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-ADM-001 ・ 管理者ログイン（authentication.md）
      </p>
      {/* TODO: Supabase Auth（メール＋パスワード）によるログインフォーム実装 */}
    </main>
  );
}
