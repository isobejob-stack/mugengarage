import { listAdminRedirects } from "@/lib/seo/queries";
import { Card } from "@/components/ui/card";

// SCR-ADM-025 ・ FR-SEO-003（必須修正5）:
// BR-URL-002（Slug変更時は必ず301リダイレクトを自動登録する）が実際に守られているかを
// 運用者が確認できるよう、redirectsの一覧表示のみを行う（編集・削除機能は持たない）。
export default async function Page() {
  const redirects = await listAdminRedirects();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        リダイレクト一覧
      </h1>
      <p className="mt-2 text-base text-foreground-muted">
        SCR-ADM-025 ・ FR-SEO-003
      </p>

      {redirects.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
          リダイレクトはまだ登録されていません。
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-foreground-muted sm:hidden">
            → 表は横にスクロールできます
          </p>
          <Card className="mt-2 sm:mt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="border-b border-neutral-200 bg-cream-50 text-left text-foreground-muted">
                  <th className="py-3 pl-4 pr-4 font-semibold">旧URL</th>
                  <th className="py-3 pr-4 font-semibold">新URL</th>
                  <th className="py-3 pr-4 font-semibold">作成日時</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-100 last:border-b-0"
                  >
                    <td className="py-3 pl-4 pr-4 font-mono text-charcoal-900">
                      {r.old_path}
                    </td>
                    <td className="py-3 pr-4 font-mono text-charcoal-900">
                      {r.new_path}
                    </td>
                    <td className="py-3 pr-4 text-foreground-muted">
                      {new Date(r.created_at).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card>
        </>
      )}
    </main>
  );
}
