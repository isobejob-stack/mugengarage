import Link from "next/link";
import { listPublicArticles } from "@/lib/content/queries";

// SCR-PUB-006: ブログ一覧
export default async function Page() {
  const articles = await listPublicArticles();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">ブログ</h1>

      {articles.length === 0 ? (
        <p className="mt-8 text-neutral-500">まだ記事はありません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/blog/${a.slug}`}
                className="block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
              >
                <p className="font-medium">{a.title}</p>
                {a.category && (
                  <p className="mt-1 text-sm text-neutral-500">{a.category}</p>
                )}
                {a.published_at && (
                  <p className="mt-1 text-sm text-neutral-400">
                    {new Date(a.published_at).toLocaleDateString("ja-JP")}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
