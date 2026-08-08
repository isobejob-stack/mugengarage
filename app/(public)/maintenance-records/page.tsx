import Link from "next/link";
import { listPublicMaintenanceRecords } from "@/lib/maintenance/queries";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";

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

  const pillClass = (active: boolean) =>
    `flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ease-standard ${
      active
        ? "border-primary-600 bg-primary-600 text-white"
        : "border-neutral-300 bg-white text-charcoal-800 hover:border-primary-400 hover:bg-primary-50"
    }`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        整備実績
      </h1>
      <p className="mt-2 text-foreground-muted">
        修理・レストア・整備の実績と作業ポイントを紹介します。
      </p>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/maintenance-records" className={pillClass(!category)}>
            すべて
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/maintenance-records?category=${encodeURIComponent(c)}`}
              className={pillClass(category === c)}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 text-foreground-muted">整備実績はまだありません。</p>
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((r) => (
            <li key={r.id}>
              <Card href={`/maintenance-records/${r.slug}`}>
                <CardBody>
                  {r.category && <CardMeta>{r.category}</CardMeta>}
                  <CardTitle>{r.title}</CardTitle>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
