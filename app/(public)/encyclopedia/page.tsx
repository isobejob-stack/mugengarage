import type { ReactNode } from "react";
import Link from "next/link";
import { listPublicEncyclopediaEntries } from "@/lib/knowledge/queries";
import { openingFromMarkdown } from "@/lib/knowledge/reading";
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
// 位置づけの変更（発注者の方針転換、2026-08-16）:
// 図鑑はグローバルナビから外れ、「読ませて誘導する場所」ではなく
// 「気になった車を引きに来た人が使う索引」になった。
// 読み物としての入口は /jaguar が持つ。
//
// そのため、この画面からは説明文とカードの装飾を落としてある。
// 以前は37項目をカードで並べ、各カードに100字の抜粋を添えていたため、
// 索引として上から探すには一画面に入る項目数が少なすぎた。
// いまは1項目1〜2行の索引にし、要約には本文の最初の見出しを使う
// （見出しがその項目の要旨になっているので、抜粋を切り出すより短く正確に伝わる）。
// 項目は1件も減らしていない。型式区分は下部に畳んで置いてある。
export default async function Page() {
  const entries = await listPublicEncyclopediaEntries();

  const brand = entries.find((e) => e.category === "brand");
  const models = entries.filter((e) => e.category === "model");
  const engines = entries.filter((e) => e.category === "engine");
  // 車種・エンジン・ブランド以外（シリーズ・世代など）はまとめて畳む
  const others = entries.filter(
    (e) => !["model", "engine", "brand"].includes(e.category),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb items={[{ label: "Jaguar図鑑" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Jaguar図鑑
      </h1>
      <p className="text-foreground-muted mt-3 text-base leading-loose">
        車種ごとの解説です。気になった車名から引いてください。
      </p>
      {/* この画面に直接来た人だけに、読み物の入口を1行で知らせる。
          「まず選ばせる」形に戻らないよう、ボタンにはしない。 */}
      <p className="mt-2 text-base">
        <Link
          href="/jaguar"
          className="text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2"
        >
          はじめての方は「ジャガーを知る」から
          <span aria-hidden="true">→</span>
        </Link>
      </p>

      {brand && (
        <IndexSection title="ブランド">
          <IndexItem
            href={`/encyclopedia/${brand.slug}`}
            title={brand.title}
            summary={summaryOf(brand.body)}
          />
        </IndexSection>
      )}

      {models.length > 0 && (
        <IndexSection title="車種" count={models.length}>
          {models.map((item) => (
            <IndexItem
              key={item.id}
              href={`/encyclopedia/${item.slug}`}
              title={item.title}
              summary={summaryOf(item.body)}
            />
          ))}
        </IndexSection>
      )}

      {engines.length > 0 && (
        <IndexSection title="エンジン" count={engines.length}>
          {engines.map((item) => (
            <IndexItem
              key={item.id}
              href={`/encyclopedia/${item.slug}`}
              title={item.title}
              summary={summaryOf(item.body)}
            />
          ))}
        </IndexSection>
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
          {/* 型式は車名さえ分かれば選べるので、要約は付けない */}
          <ul className="grid grid-cols-1 gap-x-6 border-t border-neutral-200 px-4 py-2 sm:grid-cols-2">
            {others.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/encyclopedia/${item.slug}`}
                  className="text-charcoal-900 ease-standard hover:text-primary-700 flex min-h-11 items-center text-base transition-colors duration-200 hover:underline hover:underline-offset-4"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-12 flex justify-center border-t border-neutral-200 pt-8">
        <Button href="/vehicles" variant="primary" size="md">
          在庫車両を見る
        </Button>
      </div>
    </main>
  );
}

// 索引の1行説明。
// 図鑑本文の最初の見出しはその項目の要旨そのもの（例：Eタイプ
// 「レーシングカーの構造を、そのまま公道に出した」）なので、それを使う。
// 見出しの無い本文だけ、従来どおり冒頭を切り出す。
function summaryOf(body: string): string {
  const { heading } = openingFromMarkdown(body, 0);
  return heading ?? excerptFromMarkdown(body, 60);
}

function IndexSection({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
        {title}
        {count !== undefined && (
          <span className="text-foreground-muted ml-2 text-sm font-medium">
            {count}件
          </span>
        )}
      </h2>
      <ul className="mt-2 divide-y divide-neutral-200 border-t border-b border-neutral-200">
        {children}
      </ul>
    </section>
  );
}

function IndexItem({
  href,
  title,
  summary,
}: {
  href: string;
  title: string;
  summary: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="ease-standard hover:bg-cream-100 group -mx-3 flex min-h-11 flex-col justify-center gap-0.5 rounded-lg px-3 py-3 transition-colors duration-200"
      >
        <span className="text-charcoal-900 font-serif text-lg font-bold tracking-tight underline-offset-4 group-hover:underline">
          {title}
        </span>
        {summary && (
          <span className="text-foreground-muted text-base">{summary}</span>
        )}
      </Link>
    </li>
  );
}
