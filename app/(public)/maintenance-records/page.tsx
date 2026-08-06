import Link from "next/link";
import { listPublicMaintenanceRecords } from "@/lib/maintenance/queries";

// SCR-PUB-013: 整備実績一覧（カテゴリ絞り込み・カード一覧）
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const records = await listPublicMaintenanceRecords();

  const categories = Array.from(
    new Set(
      records.map((r) => r.category).filter((c): c is string => Boolean(c)),
    ),
  );
  const filtered = category
    ? records.filter((r) => r.category === category)
    : records;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">整備実績</h1>
      <p className="mt-2 text-neutral-600">
        修理・レストア・整備の実績と作業ポイントを紹介します。
      </p>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/maintenance-records"
            className={`min-h-11 rounded-full border px-4 py-2 text-sm ${
              !category
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300"
            }`}
          >
            すべて
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/maintenance-records?category=${encodeURIComponent(c)}`}
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
        <p className="mt-8 text-neutral-500">整備実績はまだありません。</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <Link
                href={`/maintenance-records/${r.slug}`}
                className="block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
              >
                {r.category && (
                  <p className="text-sm text-neutral-500">{r.category}</p>
                )}
                <p className="mt-1 font-medium">{r.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
