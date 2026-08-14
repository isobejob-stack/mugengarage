import Link from "next/link";
import { getVehicleFavoriteRanking } from "@/lib/engagement/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

// 静的生成されるとお気に入り数が増えても順位が次回デプロイまで変わらないため、
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "人気ランキング",
  description:
    "お気に入り登録の多いクラシックJaguarをランキング形式でご紹介します。いま注目されている車両が分かります。",
  path: "/vehicles/ranking",
});

// SCR-PUB-005: 人気ランキング（お気に入り数を基に公開中の車両を順位表示、FR-FAV-004）
export default async function Page() {
  const ranking = await getVehicleFavoriteRanking(10);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        人気ランキング
      </h1>
      <p className="text-foreground-muted mt-2">
        お気に入り登録数の多い車両をランキング形式で紹介します。
      </p>

      {ranking.length === 0 ? (
        <p className="text-foreground-muted mt-8">
          まだランキングを表示できるデータがありません。
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {ranking.map((v, i) =>
            v.slug ? (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="shadow-soft ease-premium hover:border-primary-200 hover:shadow-medium flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="text-accent-500 font-serif text-2xl font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-charcoal-900 font-medium">
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </p>
                    <p className="text-primary-700 mt-1 font-mono text-lg font-bold tabular-nums">
                      ¥{v.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-foreground-muted text-sm">
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
