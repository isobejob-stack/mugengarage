import Link from "next/link";
import { listPublicLibraryEntries } from "@/lib/library/queries";
import { kanaRowOf } from "@/lib/library/schema";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

export const metadata = buildPageMetadata({
  title: "ライブラリ",
  description:
    "SUキャブレター、モノコックボディ、マッチングナンバーなど、クラシックJaguarに関する用語を辞典形式で解説します。",
  path: "/library",
});

// SCR-PUB-011: ライブラリ一覧（五十音インデックス・カテゴリ絞り込み）
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ row?: string; category?: string }>;
}) {
  const { row, category } = await searchParams;
  const entries = await listPublicLibraryEntries();

  const rows = Array.from(
    new Set(entries.map((e) => kanaRowOf(e.reading_kana))),
  ).sort();
  const categories = Array.from(
    new Set(
      entries.map((e) => e.category).filter((c): c is string => Boolean(c)),
    ),
  ).sort();

  const filtered = entries.filter((e) => {
    if (row && kanaRowOf(e.reading_kana) !== row) return false;
    if (category && e.category !== category) return false;
    return true;
  });

  const buildHref = (next: { row?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (next.row) params.set("row", next.row);
    if (next.category) params.set("category", next.category);
    const qs = params.toString();
    return qs ? `/library?${qs}` : "/library";
  };

  const pillClass = (active: boolean) =>
    `flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-standard ${
      active
        ? "border-primary-600 bg-primary-600 text-white"
        : "border-neutral-300 bg-white text-charcoal-800 hover:border-primary-400 hover:bg-primary-50"
    }`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb items={[{ label: "ライブラリ" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        ライブラリ
      </h1>
      <p className="text-foreground-muted mt-2">
        Jaguar関連の用語・知識を辞典形式でまとめています。
      </p>
      {/* 蓄積そのものがこの店の価値なので、件数を数字で出す。
          絞り込み中は「全31語のうち何語か」が分かるようにする。 */}
      <p className="text-charcoal-900 mt-3 text-base">
        {filtered.length === entries.length ? (
          <>
            全
            <strong className="text-xl font-bold tabular-nums">
              {entries.length}
            </strong>
            語
          </>
        ) : (
          <>
            該当
            <strong className="text-xl font-bold tabular-nums">
              {filtered.length}
            </strong>
            語
            <span className="text-foreground-muted ml-2 text-sm">
              （全{entries.length}語中）
            </span>
          </>
        )}
      </p>

      {rows.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={buildHref({ category })} className={pillClass(!row)}>
            すべて
          </Link>
          {rows.map((r) => (
            <Link
              key={r}
              href={buildHref({ row: r, category })}
              className={pillClass(row === r)}
            >
              {r}
            </Link>
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={buildHref({ row })} className={pillClass(!category)}>
            全カテゴリ
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={buildHref({ row, category: c })}
              className={pillClass(category === c)}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        // 31語あるのに「まだありません」と出ると、空の店に見える。
        // 絞り込みの結果0件なのだと分かる文言にし、解除の導線を必ず添える。
        <div className="bg-cream-100 mt-8 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            この条件に該当する用語はありませんでした
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            条件を外すと{entries.length}語をご覧いただけます。
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/library" variant="primary" size="md">
              すべての用語を見る
            </Button>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((e) => (
            <li key={e.id}>
              <Card href={`/library/${e.slug}`}>
                <CardBody className="p-4">
                  <CardTitle>{e.title}</CardTitle>
                  {e.category && <CardMeta>{e.category}</CardMeta>}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
