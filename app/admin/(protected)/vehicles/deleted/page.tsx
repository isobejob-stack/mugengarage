import { listDeletedVehicles } from "@/lib/inventory/queries";
import { DeletedItemsList } from "@/components/admin/deleted-items-list";
import { Button } from "@/components/ui/button";
import { VEHICLE_STATUS_PRESET } from "@/components/ui/status-badge";

// ISSUE-004課題1 / BR-DEL-002（SCR-ADM-003の削除済み一覧・復元画面）: 論理削除された車両の復元
export default async function Page() {
  const vehicles = await listDeletedVehicles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          削除済みの車両
        </h1>
        <Button href="/admin/vehicles" variant="ghost" size="sm">
          車両一覧に戻る
        </Button>
      </div>

      <DeletedItemsList
        domain="vehicles"
        items={vehicles.map((v) => ({
          ...v,
          title: `${v.manufacturers?.name ?? ""} ${v.models?.name ?? ""}${
            v.model_year ? `（${v.model_year}年）` : ""
          }`.trim(),
          // 開発部長レビュー指摘: 復元前に運用者が削除前の公開状態を把握できるよう表示する
          // （復元時にpublishedはdraftへ自動的に落とされるため、その前提を伝える情報でもある）
          meta: `¥${v.price.toLocaleString()}・削除前の状態: ${VEHICLE_STATUS_PRESET[v.status as keyof typeof VEHICLE_STATUS_PRESET]?.label ?? v.status}`,
        }))}
        emptyMessage="削除済みの車両はありません。"
      />
    </main>
  );
}
