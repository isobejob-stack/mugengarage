import type { RelatedContentItem } from "@/lib/related/types";
import { Card, CardBody, CardTitle } from "@/components/ui/card";

// FR-VEH-005 / FR-TL-003 / FR-LIB-002 / FR-MNT-002: 公開ページの関連コンテンツ表示
// 共有Cardコンポーネントのビジュアル言語（角丸・影・ホバーリフト）に合わせる。
export function RelatedContentList({
  items,
  title = "関連コンテンツ",
}: {
  items: RelatedContentItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
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
