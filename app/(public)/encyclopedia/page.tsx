import { listPublicEncyclopediaEntries } from "@/lib/knowledge/queries";
import { encyclopediaCategoryLabels } from "@/lib/knowledge/schema";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo/metadata";

// 静的生成されると管理画面での図鑑の追加・編集が次回デプロイまで反映されないため、
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Jaguar図鑑",
  description:
    "Jaguarのブランド・シリーズ・車種・世代・エンジン・技術を体系的にまとめた図鑑です。名車の系譜をたどれます。",
  path: "/encyclopedia",
});

// SCR-PUB-008: Jaguar図鑑トップ／階層一覧（カテゴリ別に表示）
export default async function Page() {
  const entries = await listPublicEncyclopediaEntries();

  const grouped = Object.entries(encyclopediaCategoryLabels)
    .map(([category, label]) => ({
      category,
      label,
      items: entries.filter((e) => e.category === category),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Jaguar図鑑
      </h1>
      <p className="text-foreground-muted mt-2">
        ブランド・シリーズ・車種・世代・エンジン・技術・歴史・用語をまとめた図鑑です。
      </p>

      {grouped.length === 0 ? (
        <p className="text-foreground-muted mt-8">まだ項目がありません。</p>
      ) : (
        grouped.map((g) => (
          <section key={g.category} className="mt-8">
            <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
              {g.label}
            </h2>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.items.map((item) => (
                <li key={item.id}>
                  <Card href={`/encyclopedia/${item.slug}`}>
                    <CardBody className="p-4">
                      <CardTitle>{item.title}</CardTitle>
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
