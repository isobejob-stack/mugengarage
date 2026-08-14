import { listDeletedMaintenanceRecords } from "@/lib/maintenance/queries";
import { DeletedItemsList } from "@/components/admin/deleted-items-list";
import { Button } from "@/components/ui/button";

// ISSUE-004課題1 / BR-DEL-002（SCR-ADM-017の削除済み一覧・復元画面）: 論理削除された整備実績の復元
export default async function Page() {
  const records = await listDeletedMaintenanceRecords();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          削除済みの整備実績
        </h1>
        <Button href="/admin/maintenance-records" variant="ghost" size="sm">
          整備実績一覧に戻る
        </Button>
      </div>

      <DeletedItemsList
        domain="maintenance-records"
        items={records.map((r) => ({
          ...r,
          title: r.title,
          meta: r.category ?? undefined,
        }))}
        emptyMessage="削除済みの整備実績はありません。"
      />
    </main>
  );
}
