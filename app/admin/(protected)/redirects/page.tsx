import { listAdminRedirects } from "@/lib/seo/queries";

// SCR-ADM-025 ・ FR-SEO-003（必須修正5）:
// BR-URL-002（Slug変更時は必ず301リダイレクトを自動登録する）が実際に守られているかを
// 運用者が確認できるよう、redirectsの一覧表示のみを行う（編集・削除機能は持たない）。
export default async function Page() {
  const redirects = await listAdminRedirects();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">リダイレクト一覧</h1>
      <p className="mt-2 text-sm text-neutral-500">SCR-ADM-025 ・ FR-SEO-003</p>

      {redirects.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          リダイレクトはまだ登録されていません。
        </p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 pr-4 font-medium">旧URL</th>
              <th className="py-2 pr-4 font-medium">新URL</th>
              <th className="py-2 font-medium">作成日時</th>
            </tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r.id} className="border-b border-neutral-200">
                <td className="py-2 pr-4 font-mono">{r.old_path}</td>
                <td className="py-2 pr-4 font-mono">{r.new_path}</td>
                <td className="py-2 text-neutral-500">
                  {new Date(r.created_at).toLocaleString("ja-JP")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
