import Link from "next/link";
import { listAdminVehicles } from "@/lib/inventory/queries";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import type { VehicleStatus } from "@/lib/inventory/types";

// SCR-ADM-003: 車両一覧（管理）
export default async function Page() {
  const vehicles = await listAdminVehicles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">車両一覧</h1>
        <Link
          href="/admin/vehicles/new"
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 font-medium text-white"
        >
          新規登録
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          登録された車両はまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {vehicles.map((v) => (
            <li key={v.id} className="rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {v.manufacturers?.name} {v.models?.name}
                    {v.model_year ? `（${v.model_year}年）` : ""}
                  </p>
                  <p className="text-sm text-neutral-500">
                    ¥{v.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <VehicleStatusBadge status={v.status as VehicleStatus} />
                  {v.status === "sold" && (
                    <Link
                      href={`/admin/owners-archive/${v.id}/edit`}
                      className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    >
                      アーカイブ編集
                    </Link>
                  )}
                  <Link
                    href={`/admin/vehicles/${v.id}/edit`}
                    className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  >
                    編集
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
