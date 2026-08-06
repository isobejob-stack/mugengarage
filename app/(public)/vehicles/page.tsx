import Link from "next/link";
import { listPublicVehicles } from "@/lib/inventory/queries";

// SCR-PUB-002: 車両一覧・検索結果（FR-SRCH-001〜003は今後実装、まずは一覧表示のみ）
export default async function Page() {
  const vehicles = await listPublicVehicles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">在庫車両一覧</h1>
        <Link href="/vehicles/ranking" className="text-sm hover:underline">
          人気ランキングを見る
        </Link>
      </div>
      <p className="mt-2 text-sm text-neutral-500">{vehicles.length}台</p>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          現在公開中の車両はありません。近日公開予定の車両にご期待ください。
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
