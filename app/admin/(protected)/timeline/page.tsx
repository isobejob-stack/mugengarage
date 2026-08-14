import { listAdminTimelineEvents } from "@/lib/timeline/queries";
import { timelineCategoryLabels } from "@/lib/timeline/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-013: 年表管理一覧
export default async function Page() {
  const events = await listAdminTimelineEvents();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          Jaguar年表
        </h1>
        <div className="flex items-center gap-3">
          <Button href="/admin/timeline/deleted" variant="ghost" size="sm">
            削除済みを見る
          </Button>
          <Button href="/admin/timeline/new" variant="primary" size="md">
            新規作成
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="text-foreground-muted mt-8 text-base">
          年表イベントはまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id}>
              <Card>
                <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-foreground-muted text-base">
                      {e.event_date}（{timelineCategoryLabels[e.category]}）
                    </p>
                    <p className="text-charcoal-900 text-lg font-semibold">
                      {e.title}
                    </p>
                  </div>
                  <Button
                    href={`/admin/timeline/${e.id}/edit`}
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
