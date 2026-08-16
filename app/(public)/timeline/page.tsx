import type { ReactNode } from "react";
import Link from "next/link";
import { Markdown } from "@/components/ui/markdown";
import { listPublicTimelineEvents } from "@/lib/timeline/queries";
import {
  decadeLabelOf,
  formatTimelineDate,
  timelineYearOf,
} from "@/lib/timeline/format";
import { listRelatedContents } from "@/lib/related/queries";
import {
  timelineCategoryLabels,
  timelineCategoryColors,
} from "@/lib/timeline/schema";
import { RelatedContentList } from "@/components/related/related-content-list";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  buildTimelineStructuredData,
  serializeStructuredData,
} from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site-config";

// 管理画面での年表の追加・編集を次のデプロイまで待たせないため、リクエストごとに描画する
// （理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "Jaguar年表",
  description:
    "1922年の創業から現代まで、Jaguarの歩みを年表でたどります。名車の登場とレースでの活躍を時系列で解説します。",
  path: "/timeline",
});

// SCR-PUB-010: Jaguar年表
//
// 2画面構成にした（発注者の指摘「情報量が多い・箇条書きすぎる」への対応）。
//
// 従来は59件すべてを本文つきの縦タイムラインで一度に出していた。
// 1件あたり200字前後の本文と関連リンクが並ぶため、全体で1万字を超え、
// 「いつ何があったか」を俯瞰する年表としてはむしろ読めない状態だった
// （加えて表示のたびに59件分の関連コンテンツ取得が走っていた）。
//
// 既定は「年 ／ 出来事」だけの一覧にして全59件を俯瞰させ、
// 年代を選んだときだけ本文・関連リンクを出す。
// 出来事の行そのものが該当年代のアンカーへのリンクなので、
// どの出来事にも1タップで到達でき、情報は1件も減っていない。
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ decade?: string }>;
}) {
  const { decade } = await searchParams;
  const events = await listPublicTimelineEvents();

  const decades = Array.from(
    new Set(events.map((e) => decadeLabelOf(e.event_date))),
  );

  if (!decade) {
    return (
      <Overview events={events} decades={decades} />
    );
  }

  const filtered = events.filter((e) => decadeLabelOf(e.event_date) === decade);

  // 関連コンテンツの取得は、本文を出す年代だけに限る（従来は毎回59件分を取得していた）
  const relatedByEvent = await Promise.all(
    filtered.map((e) => listRelatedContents("timeline_event", e.id)),
  );

  const currentIndex = decades.indexOf(decade);
  const previousDecade = currentIndex > 0 ? decades[currentIndex - 1] : null;
  const nextDecade =
    currentIndex >= 0 && currentIndex < decades.length - 1
      ? decades[currentIndex + 1]
      : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Jaguar年表", href: "/timeline" },
          { label: decade },
        ]}
      />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {decade}のジャガー
      </h1>

      {filtered.length === 0 ? (
        <div className="bg-cream-100 mt-8 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            この年代の出来事はまだ登録されていません
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/timeline" variant="primary" size="md">
              すべての年代を見る
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-foreground-muted mt-2 text-base">
            {filtered.length}件（全{events.length}件中）
          </p>
          <ol className="mt-8 flex flex-col gap-8 border-l border-neutral-200 pl-6">
            {filtered.map((e, i) => (
              // 車両詳細や年表一覧から /timeline?decade=...#event-<id> で
              // 該当の出来事へ直接飛べるようにする。
              // scroll-mt はヘッダーに隠れないための余白。
              <li
                key={e.id}
                id={`event-${e.id}`}
                className="relative scroll-mt-24"
              >
                <span
                  className={`absolute top-1 -left-[29px] h-3 w-3 rounded-full ${timelineCategoryColors[e.category]}`}
                  aria-hidden="true"
                />
                {/* 色は補助。分類は必ず文字でも示す（03_ui_rules.md 4章） */}
                <p className="text-foreground-muted text-sm">
                  {formatTimelineDate(e.event_date, e.date_precision)}
                  {" ・ "}
                  {timelineCategoryLabels[e.category]}
                </p>
                <h2 className="text-charcoal-900 mt-1 font-serif text-xl font-bold tracking-tight sm:text-2xl">
                  {e.title}
                </h2>
                {e.body && (
                  <div className="prose mt-2 max-w-none">
                    <Markdown>
                      {e.body}
                    </Markdown>
                  </div>
                )}
                <RelatedContentList
                  items={relatedByEvent[i]}
                  title="関連リンク"
                  compact
                />
              </li>
            ))}
          </ol>
        </>
      )}

      {/* 読み終えた位置に、前後の年代と全体への戻り口を置く。
          年代の一覧を画面上部に並べると、読む前に選ばせることになるため下に置く。 */}
      <nav className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-8">
        {previousDecade ? (
          <DecadeLink decade={previousDecade}>← {previousDecade}</DecadeLink>
        ) : (
          <span />
        )}
        <Link
          href="/timeline"
          className="text-charcoal-900 ease-standard hover:text-primary-700 inline-flex min-h-11 items-center text-base font-medium underline decoration-1 underline-offset-4 transition-colors duration-200"
        >
          年表全体へ戻る
        </Link>
        {nextDecade ? (
          <DecadeLink decade={nextDecade}>{nextDecade} →</DecadeLink>
        ) : (
          <span />
        )}
      </nav>

      <div className="mt-8 flex justify-center">
        <Button href="/vehicles" variant="primary" size="md">
          在庫車両を見る
        </Button>
      </div>
    </main>
  );
}

// 既定表示。全59件を「年 ／ 出来事」だけで俯瞰させる。
function Overview({
  events,
  decades,
}: {
  events: Awaited<ReturnType<typeof listPublicTimelineEvents>>;
  decades: string[];
}) {
  // FR-SEO-002: 年表の構造化データ。
  // 出来事1件ずつに固有のURLが無いため、Eventを個別に出さずページ全体をItemListとして出す
  // （URLの無い項目をEventで出すと、検索結果からどこにも着地できない断片が増える）。
  const structuredDataJson = serializeStructuredData(
    buildTimelineStructuredData({
      url: `${SITE_URL}/timeline`,
      items: events.map((e) => ({ name: e.title, date: e.event_date })),
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <Breadcrumb items={[{ label: "Jaguar年表" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Jaguar年表
      </h1>
      <p className="text-foreground-muted mt-3 text-base leading-loose">
        創業から現在までの{events.length}
        件です。出来事を選ぶと、その年代の解説を読めます。
      </p>

      {decades.map((label) => {
        const items = events.filter(
          (e) => decadeLabelOf(e.event_date) === label,
        );
        const decadeHref = `/timeline?decade=${encodeURIComponent(label)}`;
        return (
          <section key={label} className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-neutral-200 pb-2">
              <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
                {label}
              </h2>
              <Link
                href={decadeHref}
                className="text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 text-base font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2"
              >
                この年代を読む
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ol className="divide-y divide-neutral-200">
              {items.map((e) => (
                <li key={e.id}>
                  {/* 行そのものを、その出来事の本文へのリンクにする。
                      年と出来事を2列に固定して、目が縦に滑るようにする。 */}
                  <Link
                    href={`${decadeHref}#event-${e.id}`}
                    className="ease-standard hover:bg-cream-100 -mx-2 grid min-h-11 grid-cols-[3.5rem_1fr] items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200"
                  >
                    <span className="text-foreground-muted font-mono text-sm tabular-nums">
                      {timelineYearOf(e.event_date)}
                    </span>
                    <span className="text-charcoal-900 text-base">
                      {e.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <div className="mt-12 flex justify-center border-t border-neutral-200 pt-8">
        <Button href="/vehicles" variant="primary" size="md">
          在庫車両を見る
        </Button>
      </div>
    </main>
  );
}

function DecadeLink({
  decade,
  children,
}: {
  decade: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/timeline?decade=${encodeURIComponent(decade)}`}
      className="text-primary-700 ease-standard inline-flex min-h-11 items-center text-base font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2"
    >
      {children}
    </Link>
  );
}
