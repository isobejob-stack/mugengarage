import Link from "next/link";
import { listPublicLibraryEntries } from "@/lib/library/queries";
import { kanaRowOf } from "@/lib/library/schema";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        ライブラリ
      </h1>
      <p className="mt-2 text-foreground-muted">
        Jaguar関連の用語・知識を辞典形式でまとめています。
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
        <p className="mt-8 text-foreground-muted">項目はまだありません。</p>
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
