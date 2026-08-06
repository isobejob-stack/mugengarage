import Link from "next/link";
import { getVehicleFavoriteRanking } from "@/lib/engagement/queries";

// SCR-PUB-005: 人気ランキング（お気に入り数を基に公開中の車両を順位表示、FR-FAV-004）
export default async function Page() {
  const ranking = await getVehicleFavoriteRanking(10);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">人気ランキング</h1>
      <p className="mt-2 text-neutral-600">
        お気に入り登録数の多い車両をランキング形式で紹介します。
      </p>

      {ranking.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          まだランキングを表示できるデータがありません。
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {ranking.map((v, i) =>
            v.slug ? (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="flex items-center gap-4 rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
                >
                  <span className="text-xl font-bold text-neutral-400">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      ¥{v.price.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm text-neutral-500">
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
