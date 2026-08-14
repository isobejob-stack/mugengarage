import { listAdminVehicles } from "@/lib/inventory/queries";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import type { VehicleStatus } from "@/lib/inventory/types";

// SCR-ADM-003: 車両一覧（管理）
export default async function Page() {
  const vehicles = await listAdminVehicles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          車両一覧
        </h1>
        <div className="flex items-center gap-3">
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

      {vehicles.length === 0 ? (
        <p className="text-foreground-muted mt-8 text-base">
          登録された車両はまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Card>
                <CardBody className="flex flex-row flex-wrap items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-charcoal-900 text-lg font-semibold">
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </p>
                    <p className="text-foreground-muted text-base">
                      ¥{v.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <VehicleStatusBadge status={v.status as VehicleStatus} />
                    {v.status === "sold" && (
                      <Button
                        href={`/admin/owners-archive/${v.id}/edit`}
                        variant="outline"
                        size="sm"
                      >
                        アーカイブ編集
                      </Button>
                    )}
                    <Button
                      href={`/admin/vehicles/${v.id}/edit`}
                      variant="outline"
                      size="sm"
                    >
                      編集
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
