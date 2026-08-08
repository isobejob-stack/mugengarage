import Link from "next/link";
import { getVehicleFavoriteRanking } from "@/lib/engagement/queries";

// 静的生成されるとお気に入り数が増えても順位が次回デプロイまで変わらないため、
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

// SCR-PUB-005: 人気ランキング（お気に入り数を基に公開中の車両を順位表示、FR-FAV-004）
export default async function Page() {
  const ranking = await getVehicleFavoriteRanking(10);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        人気ランキング
      </h1>
      <p className="mt-2 text-foreground-muted">
        お気に入り登録数の多い車両をランキング形式で紹介します。
      </p>

      {ranking.length === 0 ? (
        <p className="mt-8 text-foreground-muted">
          まだランキングを表示できるデータがありません。
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {ranking.map((v, i) =>
            v.slug ? (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-primary-200 hover:shadow-medium"
                >
                  <span className="font-serif text-2xl font-bold text-accent-500">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal-900">
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </p>
                    <p className="mt-1 font-mono text-lg font-bold tabular-nums text-primary-700">
                      ¥{v.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm text-foreground-muted">
                    ♥ {v.favoriteCount}
                  </span>
                </Link>
              </li>
            ) : null,
          )}
        </ol>
      )}
    </main>
  );
}
