import Link from "next/link";
import { SITE_URL } from "@/lib/site-config";
import { serializeStructuredData } from "@/lib/seo/structured-data";

// FR-SEO-006: パンくずリスト。
//
// 詳細ページの多く（車両・ブログ・図鑑・ライブラリ・整備実績）は、
// サイトのトップからではなく検索結果から直接開かれる。
// その状態で「今どの分類の中にいるのか」「一覧に戻るには」が分からないと、
// 1ページ見て離脱することになる。ヘッダーのナビゲーションはサイト全体の
// 入口であって、今いる場所を示すものではない。
//
// あわせて BreadcrumbList の構造化データを出力する。
// Googleの検索結果に「エムガレージ › 在庫車両 › Eタイプ」という階層が表示され、
// URLだけが並ぶより何のページか伝わりやすくなる。

export type Crumb = {
  label: string;
  /** 省略した場合は現在地（リンクにしない）として扱う */
  href?: string;
};

export function Breadcrumb({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;

  // トップは常に先頭に置く。呼び出し側で毎回書くと表記が揺れるため。
  const crumbs: Crumb[] = [{ label: "ホーム", href: "/" }, ...items];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      // 現在地（href無し）にはitemを付けない。Googleの仕様上、最後の要素は
      // URLを持たなくてよい（持たせると自己参照になる）。
      ...(crumb.href ? { item: `${SITE_URL}${crumb.href}` } : {}),
    })),
  };

  // 車両名・記事タイトルは管理画面からの入力を含むため、`</script>` の混入で
  // scriptタグが閉じられないようエスケープする（他のJSON-LDと共通の処理）。
  const structuredDataJson = serializeStructuredData(structuredData);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <nav aria-label="パンくずリスト">
        <ol className="text-foreground-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center">
                {index > 0 && (
                  <span aria-hidden="true" className="mr-2 text-neutral-300">
                    ／
                  </span>
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-charcoal-900 underline-offset-4 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  // 現在地は読み上げ順でも「今ここ」と分かるようにする。
                  // 長いタイトルが1行を占有しないよう、狭い画面では省略する。
                  <span
                    aria-current="page"
                    className="text-charcoal-900 max-w-[16rem] truncate font-medium sm:max-w-none"
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
