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

function decadeOf(dateStr: string) {
  const year = new Date(dateStr).getFullYear();
  return `${Math.floor(year / 10) * 10}年代`;
}

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
      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        Jaguar年表
      </h1>
      <p className="mt-2 text-foreground-muted">
        Jaguarブランドの歴史を時系列でたどります。
      </p>

      {decades.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/timeline"
            className={`flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-standard ${
              !decade
                ? "border-primary-600 bg-primary-600 text-white"
                : "border-neutral-300 bg-white text-charcoal-800 hover:border-primary-400 hover:bg-primary-50"
            }`}
          >
            すべて
          </Link>
          {decades.map((d) => (
            <Link
              key={d}
              href={`/timeline?decade=${encodeURIComponent(d)}`}
              className={`flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-standard ${
                decade === d
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-neutral-300 bg-white text-charcoal-800 hover:border-primary-400 hover:bg-primary-50"
              }`}
            >
              {d}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 text-foreground-muted">イベントはまだありません。</p>
      ) : (
        <ol className="mt-8 flex flex-col gap-8 border-l border-neutral-200 pl-6">
          {filtered.map((e, i) => (
            <li key={e.id} className="relative">
              <span
                className={`absolute top-1 -left-[29px] h-3 w-3 rounded-full ${timelineCategoryColors[e.category]}`}
              />
              <p className="text-sm text-foreground-muted">
                {e.event_date}
                {" ・ "}
                {timelineCategoryLabels[e.category]}
              </p>
              <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
                {e.title}
              </h2>
              {e.body && (
                <div className="prose mt-2 max-w-none text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {e.body}
                  </ReactMarkdown>
                </div>
              )}
              <RelatedContentList
                items={relatedByEvent[i]}
                title="関連リンク"
              />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
