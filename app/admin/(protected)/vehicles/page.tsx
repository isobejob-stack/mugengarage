import { listAdminVehicles } from "@/lib/inventory/queries";
import { Button } from "@/components/ui/button";
import { AdminVehicleList } from "@/components/inventory/admin-vehicle-list";

// SCR-ADM-003: 車両一覧（管理）
export default async function Page() {
  const vehicles = await listAdminVehicles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          車両一覧
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/admin/vehicles/deleted" variant="ghost" size="sm">
            削除済みを見る
          </Button>
          {/* FR-INV-001: 現地（車の目の前）でメーカー・車種・価格のみですぐ登録し、
              その場で写真アップロードへ進む簡易フロー。通常の新規登録と区別するためsecondaryにする */}
          <Button
            href="/admin/vehicles/quick-new"
            variant="secondary"
            size="md"
          >
            現地でクイック登録
          </Button>
          <Button href="/admin/vehicles/new" variant="primary" size="md">
            新規登録
          </Button>
        </div>
      </div>

      <AdminVehicleList vehicles={vehicles} />
    </main>
  );
}
