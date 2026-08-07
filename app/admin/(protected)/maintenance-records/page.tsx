import { listAdminMaintenanceRecords } from "@/lib/maintenance/queries";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-017: 整備実績管理一覧
export default async function Page() {
  const records = await listAdminMaintenanceRecords();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          整備実績
        </h1>
        <div className="flex items-center gap-3">
          <Button href="/admin/maintenance-records/deleted" variant="ghost" size="sm">
            削除済みを見る
          </Button>
          <Button href="/admin/maintenance-records/new" variant="primary" size="md">
            新規作成
          </Button>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
          整備実績はまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {records.map((r) => (
            <li key={r.id}>
              <Card>
                <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
                  <div>
                    {r.category && (
                      <p className="text-base text-foreground-muted">
                        {r.category}
                      </p>
                    )}
                    <p className="text-lg font-semibold text-charcoal-900">
                      {r.title}
                    </p>
                  </div>
                  <Button
                    href={`/admin/maintenance-records/${r.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    編集
                  </Button>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
