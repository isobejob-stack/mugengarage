import Link from "next/link";
import { getSessionId } from "@/lib/engagement/session";
import { getPublicFavoriteVehicles } from "@/lib/engagement/queries";

// SCR-PUB-004: お気に入り一覧（匿名セッションIDに紐づく車両を表示、FR-FAV-002）
export default async function Page() {
  const sessionId = await getSessionId();
  const vehicles = sessionId ? await getPublicFavoriteVehicles(sessionId) : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">お気に入り一覧</h1>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          お気に入り登録した車両はまだありません。車両詳細ページの「お気に入りに登録」から追加できます。
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {vehicles.map((v) =>
            v.slug ? (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
                >
                  <p className="font-medium">
                    {v.manufacturers?.name} {v.models?.name}
                    {v.model_year ? `（${v.model_year}年）` : ""}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {v.mileage_km !== null
                      ? `走行距離 ${v.mileage_km.toLocaleString()}km`
                      : ""}
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    ¥{v.price.toLocaleString()}
                  </p>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </main>
  );
}
