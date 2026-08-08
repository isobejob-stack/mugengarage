import { listPublicArticles } from "@/lib/content/queries";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";

// 検索条件（searchParams）を読まないページはNext.jsが既定でビルド時に静的生成する。
// このページはDBから公開記事を取得するため、静的化されると「管理画面で記事を追加・編集しても
// 次回デプロイまで公開サイトに反映されない」状態になる（revalidatePathも未使用のため永久に古いまま）。
// 在庫車両一覧等の他の公開ページは元々リクエストごとに描画されており、それらと挙動を揃える。
// 副次効果として、このページがビルド時のDB依存から外れるためデプロイがDB障害の影響を受けなくなる。
export const dynamic = "force-dynamic";

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
