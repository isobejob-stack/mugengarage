import { listDeletedTimelineEvents } from "@/lib/timeline/queries";
import { timelineCategoryLabels } from "@/lib/timeline/schema";
import { DeletedItemsList } from "@/components/admin/deleted-items-list";
import { Button } from "@/components/ui/button";

// ISSUE-004課題1 / BR-DEL-002（SCR-ADM-013の削除済み一覧・復元画面）: 論理削除された年表イベントの復元
export default async function Page() {
  const events = await listDeletedTimelineEvents();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          削除済みの年表イベント
        </h1>
        <Button href="/admin/timeline" variant="ghost" size="sm">
          年表一覧に戻る
        </Button>
      </div>

      <DeletedItemsList
        domain="timeline"
        items={events.map((e) => ({
          ...e,
          title: e.title,
          meta: `${e.event_date}（${timelineCategoryLabels[e.category]}）`,
        }))}
        emptyMessage="削除済みの年表イベントはありません。"
      />
    </main>
  );
}
