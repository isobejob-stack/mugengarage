import type { RelatedContentItem } from "@/lib/related/types";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

// FR-VEH-005 / FR-TL-003 / FR-LIB-002 / FR-MNT-002: 公開ページの関連コンテンツ表示
// 共有Cardコンポーネントのビジュアル言語（角丸・影・ホバーリフト）に合わせる。
export function RelatedContentList({
  items,
  title = "関連コンテンツ",
  compact = false,
}: {
  items: RelatedContentItem[];
  title?: string;
  /**
   * ページ末尾ではなく、他の要素の内側に置くとき用。
   *
   * 既定の mt-16（64px）はページ末尾のセクション間隔として設計している。
   * 年表のように「1件の出来事の中」に置くと、出来事どうしの間隔（32px）より
   * 自分の関連リンクとの間隔のほうが広くなり、
   * 「離れているほうが自分のもの」という逆転が起きてどれに属するか分からなくなる。
   */
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className={compact ? "mt-3" : "mt-16"}>
      <h2
        className={
          compact
            ? "text-charcoal-900 text-base font-bold"
            : "text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl"
        }
      >
        {title}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={`${item.type}:${item.id}`}>
            <Card href={item.url}>
              <CardBody>
                <CardTitle>{item.label}</CardTitle>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
