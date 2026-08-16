import { listPublicTimelineEvents } from "@/lib/timeline/queries";
import { listRelatedContents } from "@/lib/related/queries";
import {
  timelineCategoryLabels,
  timelineCategoryColors,
} from "@/lib/timeline/schema";
import { RelatedContentList } from "@/components/related/related-content-list";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

function decadeOf(dateStr: string) {
  const year = new Date(dateStr).getFullYear();
  return `${Math.floor(year / 10) * 10}年代`;
}

export const metadata = buildPageMetadata({
  title: "Jaguar年表",
  description:
    "1922年の創業から現代まで、Jaguarの歩みを年表でたどります。名車の登場とレースでの活躍を時系列で解説します。",
  path: "/timeline",
});

// SCR-PUB-010: Jaguar年表（縦型タイムライン、カテゴリ色分け、年代絞り込み）
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ decade?: string }>;
}) {
  const { decade } = await searchParams;
  const events = await listPublicTimelineEvents();

  const decades = Array.from(
    new Set(events.map((e) => decadeOf(e.event_date))),
  );
  const filtered = decade
    ? events.filter((e) => decadeOf(e.event_date) === decade)
    : events;

  const relatedByEvent = await Promise.all(
    filtered.map((e) => listRelatedContents("timeline_event", e.id)),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb items={[{ label: "Jaguar年表" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        Jaguar年表
      </h1>
      <p className="text-foreground-muted mt-2">
        1922年の創業から現在まで、Jaguarの歩みを時系列でたどります。
      </p>
      {/* 蓄積量そのものが価値なので件数を出す。絞り込み中は母数も併記する */}
      <p className="text-charcoal-900 mt-3 text-base">
        {decade ? (
          <>
            {decade}
            <strong className="mx-1 text-xl font-bold tabular-nums">
              {filtered.length}
            </strong>
            件
            <span className="text-foreground-muted ml-2 text-sm">
              （全{events.length}件中）
            </span>
          </>
        ) : (
          <>
            全
            <strong className="text-xl font-bold tabular-nums">
              {events.length}
            </strong>
            件
          </>
        )}
      </p>

      {decades.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/timeline"
            className={`ease-standard flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              !decade
                ? "border-primary-600 bg-primary-600 text-white"
                : "text-charcoal-800 hover:border-primary-400 hover:bg-primary-50 border-neutral-300 bg-white"
            }`}
          >
            すべて
          </Link>
          {decades.map((d) => (
            <Link
              key={d}
              href={`/timeline?decade=${encodeURIComponent(d)}`}
              className={`ease-standard flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                decade === d
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "text-charcoal-800 hover:border-primary-400 hover:bg-primary-50 border-neutral-300 bg-white"
              }`}
            >
              {d}
            </Link>
          ))}
        </div>
      )}

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
        <ol className="mt-8 flex flex-col gap-8 border-l border-neutral-200 pl-6">
          {filtered.map((e, i) => (
            // 車両詳細などから /timeline#event-<id> で該当の出来事へ直接飛べるようにする。
            // 年表は縦に長く、飛び先の位置が分からないと結局探し直しになるため。
            // scroll-mt はヘッダーに隠れないための余白。
            <li
              key={e.id}
              id={`event-${e.id}`}
              className="relative scroll-mt-24"
            >
              <span
                className={`absolute top-1 -left-[29px] h-3 w-3 rounded-full ${timelineCategoryColors[e.category]}`}
              />
              <p className="text-foreground-muted text-sm">
                {e.event_date}
                {" ・ "}
                {timelineCategoryLabels[e.category]}
              </p>
              <h2 className="text-charcoal-900 mt-1 font-serif text-xl font-bold tracking-tight sm:text-2xl">
                {e.title}
              </h2>
              {e.body && (
                <div className="prose mt-2 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {e.body}
                  </ReactMarkdown>
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
      )}
      <div className="mt-12 flex flex-wrap justify-center gap-3 border-t border-neutral-200 pt-8">
        <Button href="/vehicles" variant="primary" size="md">
          在庫車両を見る
        </Button>
        <Button href="/encyclopedia" variant="outline" size="md">
          車種ごとの解説を読む
        </Button>
      </div>
    </main>
  );
}
