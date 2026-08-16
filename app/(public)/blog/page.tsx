import Link from "next/link";
import { listPublicArticles } from "@/lib/content/queries";
import { contentCategoryLabel } from "@/lib/content/categories";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/metadata";

// 検索条件（searchParams）を読まないページはNext.jsが既定でビルド時に静的生成する。
// このページはDBから公開記事を取得するため、静的化されると「管理画面で記事を追加・編集しても
// 次回デプロイまで公開サイトに反映されない」状態になる（revalidatePathも未使用のため永久に古いまま）。
// 在庫車両一覧等の他の公開ページは元々リクエストごとに描画されており、それらと挙動を揃える。
// 副次効果として、このページがビルド時のDB依存から外れるためデプロイがDB障害の影響を受けなくなる。
// カテゴリ絞り込み（?category=）でsearchParamsを読むようになった今も、
// 「編集が即反映される」という理由は変わらないため明示的に指定を残す。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "ブログ",
  description:
    "クラシックJaguarの新着入庫・購入ガイド・整備記録・技術解説など、専門店の視点で綴る読み物をお届けします。",
  path: "/blog",
});

const chipClass = (active: boolean) =>
  `ease-standard flex min-h-11 items-center rounded-full border px-4 py-2 text-base font-medium transition-colors duration-200 ${
    active
      ? "border-primary-600 bg-primary-600 text-white"
      : "border-neutral-300 bg-white text-charcoal-800 hover:border-primary-400 hover:bg-primary-50"
  }`;

// SCR-PUB-006: ブログ一覧（カテゴリ絞り込み付き）
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const articles = await listPublicArticles();

  // chipに出す件数。0件のカテゴリはchipごと出さない（在庫一覧の絞り込みと同じ作法で、
  // 「押したら0件だった」という空振りを起こさないため）。
  // 5分類に無い値がDBに残っていても、その値でchipを作って到達できるようにする
  // （移行SQLを流す前に記事が迷子にならないようにする）。
  const counts = new Map<string, number>();
  for (const a of articles) {
    if (!a.category) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
  }
  const categoryChips = Array.from(counts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"),
  );

  const filtered = category
    ? articles.filter((a) => a.category === category)
    : articles;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        ブログ
      </h1>
      <p className="text-foreground-muted mt-2 text-base">
        新着入庫のご紹介から、購入ガイド・整備記録・技術解説まで。クラシックJaguarとの付き合い方をお伝えします。
      </p>

      {categoryChips.length > 0 && (
        <nav aria-label="カテゴリで絞り込む" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/blog"
                aria-current={!category ? "page" : undefined}
                className={chipClass(!category)}
              >
                すべて（{articles.length}）
              </Link>
            </li>
            {categoryChips.map(([value, count]) => (
              <li key={value}>
                <Link
                  href={`/blog?category=${encodeURIComponent(value)}`}
                  aria-current={category === value ? "page" : undefined}
                  className={chipClass(category === value)}
                >
                  {contentCategoryLabel(value)}（{count}）
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* 何件を見ているのかを結果の直上に出す。選択中のカテゴリは色（chipの塗り）だけでなく
          文言でも示す（03_ui_rules.md: 色だけで情報を伝えない）。 */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <p className="text-charcoal-900 text-base">
          {category && (
            <span className="text-foreground-muted mr-2">
              「{contentCategoryLabel(category)}」の記事
            </span>
          )}
          <strong className="text-xl font-bold tabular-nums">
            {filtered.length}
          </strong>
          件
        </p>
      </div>

      {filtered.length === 0 ? (
        // 0件で行き止まりにしない。カテゴリを選んだ結果が空でも、
        // ここから全記事へ戻れるようにする（戻る導線が無いと離脱する）。
        <div className="bg-cream-100 mt-8 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            {category
              ? "このカテゴリの記事はまだありません"
              : "まだ記事はありません"}
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            他のカテゴリには読み物があります。ご覧になりたい内容が見つからない場合は、お気軽にお問い合わせください。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/blog" variant="primary" size="md">
              すべての記事を見る
            </Button>
            <Button href="/vehicles" variant="outline" size="md">
              在庫車両を見る
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {filtered.map((a) => (
            <li key={a.id}>
              <Card href={`/blog/${a.slug}`}>
                <CardBody>
                  <CardTitle>{a.title}</CardTitle>
                  {a.category && (
                    <CardMeta>{contentCategoryLabel(a.category)}</CardMeta>
                  )}
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
