import Link from "next/link";
import { listAdminLibraryEntries } from "@/lib/library/queries";

// SCR-ADM-015: ライブラリ管理一覧
export default async function Page() {
  const entries = await listAdminLibraryEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ライブラリ</h1>
        <Link
          href="/admin/library/new"
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 font-medium text-white"
        >
          新規作成
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          ライブラリ項目はまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  {e.category && (
                    <p className="text-sm text-neutral-500">{e.category}</p>
                  )}
                  <p className="font-medium">{e.title}</p>
                </div>
                <Link
                  href={`/admin/library/${e.id}/edit`}
                  className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  編集
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
