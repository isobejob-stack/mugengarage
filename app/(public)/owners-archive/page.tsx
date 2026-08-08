import Link from "next/link";
import { listPublicOwnerArchiveEntries } from "@/lib/archive/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { buildPageMetadata } from "@/lib/seo/metadata";

// 静的生成されると管理画面でのオーナーズアーカイブの追加・編集が次回デプロイまで反映されないため、
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "オーナーズアーカイブ",
  description:
    "これまでにご成約いただいたクラシックJaguarを、当店の販売実績としてご紹介します。",
  path: "/owners-archive",
});

// SCR-PUB-015: オーナーズアーカイブ一覧（過去に販売した車両を在庫とは視覚的に区別して表示、FR-OWN-003）
export default async function Page() {
  const entries = await listPublicOwnerArchiveEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        オーナーズアーカイブ
      </h1>
      <p className="mt-2 text-foreground-muted">
        これまでにご成約いただいた車両を、当店の実績としてご紹介します。
      </p>

      {entries.length === 0 ? (
        <p className="mt-8 text-foreground-muted">
          アーカイブされた車両はまだありません。
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entries.map((e) => (
            <li key={e.vehicle_id}>
              {/* 在庫の生きたCardコンポーネントとは意図的に見た目を変え、
                  「ご成約済み＝もう買えない過去の実績」であることを視覚的に区別する（FR-OWN-003）。 */}
              <Link
                href={`/owners-archive/${e.vehicle_id}`}
                className="block rounded-2xl border border-neutral-300 bg-cream-100 p-4 shadow-soft transition-colors duration-200 ease-standard hover:border-neutral-400"
              >
                <StatusBadge label="ご成約済み" tone="neutral" />
                <p className="mt-2 font-medium text-charcoal-900">
                  {e.vehicles?.manufacturers?.name} {e.vehicles?.models?.name}
                  {e.vehicles?.model_year
                    ? `（${e.vehicles.model_year}年）`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
