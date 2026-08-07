import { listPublicArticles } from "@/lib/content/queries";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";

// SCR-PUB-006: ブログ一覧
export default async function Page() {
  const articles = await listPublicArticles();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        ブログ
      </h1>

      {articles.length === 0 ? (
        <p className="mt-8 text-foreground-muted">まだ記事はありません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {articles.map((a) => (
            <li key={a.id}>
              <Card href={`/blog/${a.slug}`}>
                <CardBody>
                  <CardTitle>{a.title}</CardTitle>
                  {a.category && <CardMeta>{a.category}</CardMeta>}
                  {a.published_at && (
                    <CardMeta>
                      {new Date(a.published_at).toLocaleDateString("ja-JP")}
                    </CardMeta>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
