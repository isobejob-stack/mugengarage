import Link from "next/link";
import { listAdminArticles } from "@/lib/content/queries";
import { StatusBadge } from "@/components/ui/status-badge";

// SCR-ADM-009: ブログ記事一覧（管理）
export default async function Page() {
  const articles = await listAdminArticles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ブログ記事</h1>
        <Link
          href="/admin/articles/new"
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 font-medium text-white"
        >
          新規作成
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="mt-8 text-neutral-500">記事はまだありません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {articles.map((a) => (
            <li key={a.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{a.title}</p>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    label={a.status === "published" ? "公開" : "下書き"}
                    tone={a.status === "published" ? "success" : "neutral"}
                  />
                  <Link
                    href={`/admin/articles/${a.id}/edit`}
                    className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    編集
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
