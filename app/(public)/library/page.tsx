import Link from "next/link";
import { listPublicLibraryEntries } from "@/lib/library/queries";
import { kanaRowOf } from "@/lib/library/schema";

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

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">ライブラリ</h1>
      <p className="mt-2 text-neutral-600">
        Jaguar関連の用語・知識を辞典形式でまとめています。
      </p>

      {rows.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={buildHref({ category })}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm ${
              !row
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300"
            }`}
          >
            すべて
          </Link>
          {rows.map((r) => (
            <Link
              key={r}
              href={buildHref({ row: r, category })}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm ${
                row === r
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300"
              }`}
            >
              {r}
            </Link>
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={buildHref({ row })}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm ${
              !category
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300"
            }`}
          >
            全カテゴリ
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={buildHref({ row, category: c })}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm ${
                category === c
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 text-neutral-500">項目はまだありません。</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((e) => (
            <li key={e.id}>
              <Link
                href={`/library/${e.slug}`}
                className="block rounded-md border border-neutral-200 p-3 hover:border-neutral-400"
              >
                {e.title}
                {e.category && (
                  <span className="ml-2 text-sm text-neutral-500">
                    {e.category}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
