import Link from "next/link";
import { listPublicOwnerArchiveEntries } from "@/lib/archive/queries";

// SCR-PUB-015: オーナーズアーカイブ一覧（過去に販売した車両を在庫とは視覚的に区別して表示、FR-OWN-003）
export default async function Page() {
  const entries = await listPublicOwnerArchiveEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">オーナーズアーカイブ</h1>
      <p className="mt-2 text-neutral-600">
        これまでにご成約いただいた車両を、当店の実績としてご紹介します。
      </p>

      {entries.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          アーカイブされた車両はまだありません。
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {entries.map((e) => (
            <li key={e.vehicle_id}>
              <Link
                href={`/owners-archive/${e.vehicle_id}`}
                className="block rounded-md border border-neutral-300 bg-neutral-50 p-4 hover:border-neutral-500"
              >
                <p className="text-xs font-medium text-neutral-500">
                  ご成約済み
                </p>
                <p className="mt-1 font-medium">
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
