import { listPublicEncyclopediaEntries } from "@/lib/knowledge/queries";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";

// 静的生成されると管理画面での図鑑の追加・編集が次回デプロイまで反映されないため、
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Jaguar図鑑",
  description:
    "Eタイプ・XK・Mark2・XJなど、Jaguarの名車を車種ごとに解説します。設計思想・乗り味・他にない特色から、その車を所有するということまで。",
  path: "/encyclopedia",
});

// SCR-PUB-008: Jaguar図鑑トップ
//
// 従来はカテゴリ別にタイトルだけのカードを36枚並べていた。
// うち21枚は「シリーズ（型式区分）」で、車を探しに来た人にとっては
// まだ読む段階にない情報である。それが車種解説と同じ大きさで同列に並ぶため、
// どこから読めばよいのか分からない状態になっていた。
//
// 読み手は「この車がどういうものか知りたい」という関心で来る。
// 車種を主役に据え、エンジン解説を次に置き、型式区分は畳んで下層に送る。
// 情報は減らさず、順序と大きさで優先度を示す。
export default async function Page() {
  const entries = await listPublicEncyclopediaEntries();

  const models = entries.filter((e) => e.category === "model");
  const engines = entries.filter((e) => e.category === "engine");
  const brand = entries.find((e) => e.category === "brand");
  // 車種・エンジン・ブランド以外（シリーズ・世代など）はまとめて畳む
  const others = entries.filter(
    (e) => !["model", "engine", "brand"].includes(e.category),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: "Jaguar図鑑" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Jaguar図鑑
      </h1>
      <p className="text-foreground-muted mt-2 max-w-2xl text-base">
        名車と呼ばれる理由は、たいてい数字の外側にあります。
        どういう考えで設計され、走らせるとどうで、他とどう違うのか。
        車種ごとにご紹介します。
      </p>

      {brand && (
        <section className="mt-8">
          <Card href={`/encyclopedia/${brand.slug}`}>
            <CardBody className="p-5 sm:p-6">
              <p className="text-primary-700 text-sm font-medium">はじめに</p>
              <CardTitle className="mt-1">
                {brand.title}というブランド
              </CardTitle>
              <p className="text-foreground-muted mt-2 text-base">
                {excerptFromMarkdown(brand.body, 120)}
              </p>
            </CardBody>
          </Card>
        </section>
      )}

      {models.length > 0 && (
        <section className="mt-10">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            車種から知る
          </h2>
          <p className="text-foreground-muted mt-1 text-base">
            設計思想・乗り味・所有するということまで。
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {models.map((item) => (
              <li key={item.id}>
                <Card href={`/encyclopedia/${item.slug}`}>
                  <CardBody className="p-5">
                    <CardTitle>{item.title}</CardTitle>
                    {/* 抜粋を出す。タイトルだけでは、11車種のどれを開くべきか選べない */}
                    <p className="text-foreground-muted mt-2 text-base">
                      {excerptFromMarkdown(item.body, 100)}
                    </p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {engines.length > 0 && (
        <section className="mt-10">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            エンジンから知る
          </h2>
          <p className="text-foreground-muted mt-1 text-base">
            Jaguarを語るうえで避けて通れない、3つの心臓。
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {engines.map((item) => (
              <li key={item.id}>
                <Card href={`/encyclopedia/${item.slug}`}>
                  <CardBody className="p-5">
                    <CardTitle>{item.title}</CardTitle>
                    <p className="text-foreground-muted mt-2 text-base">
                      {excerptFromMarkdown(item.body, 100)}
                    </p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {others.length > 0 && (
        // 型式区分は「読み物」ではなく「調べもの」。必要な人だけが開けばよい。
        // 消さずに畳むことで、車種解説の存在感を確保する。
        <details className="group mt-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <summary className="text-charcoal-900 hover:bg-cream-100 flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-bold">
            <span>
              シリーズ・型式を詳しく見る
              <span className="text-foreground-muted ml-2 text-sm font-medium">
                （{others.length}件）
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-foreground-muted shrink-0 text-sm transition-transform group-open:rotate-180"
            >
              ▼
            </span>
          </summary>
          <ul className="grid grid-cols-1 gap-2 border-t border-neutral-200 p-4 sm:grid-cols-2">
            {others.map((item) => (
              <li key={item.id}>
                <Card href={`/encyclopedia/${item.slug}`}>
                  <CardBody className="p-3">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-3 border-t border-neutral-200 pt-8">
        <Button href="/vehicles" variant="primary" size="md">
          在庫車両を見る
        </Button>
        <Button href="/timeline" variant="outline" size="md">
          Jaguarの歩みを年表で見る
        </Button>
      </div>
    </main>
  );
}
