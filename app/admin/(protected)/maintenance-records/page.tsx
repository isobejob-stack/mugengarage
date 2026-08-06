import Link from "next/link";
import { listAdminMaintenanceRecords } from "@/lib/maintenance/queries";

// SCR-ADM-017: 整備実績管理一覧
export default async function Page() {
  const records = await listAdminMaintenanceRecords();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">整備実績</h1>
        <Link
          href="/admin/maintenance-records/new"
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 font-medium text-white"
        >
          新規作成
        </Link>
      </div>

      {records.length === 0 ? (
        <p className="mt-8 text-neutral-500">整備実績はまだありません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {records.map((r) => (
            <li key={r.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  {r.category && (
                    <p className="text-sm text-neutral-500">{r.category}</p>
                  )}
                  <p className="font-medium">{r.title}</p>
                </div>
                <Link
                  href={`/admin/maintenance-records/${r.id}/edit`}
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
