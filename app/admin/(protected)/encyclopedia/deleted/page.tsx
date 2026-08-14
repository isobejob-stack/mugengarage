import { listDeletedEncyclopediaEntries } from "@/lib/knowledge/queries";
import { encyclopediaCategoryLabels } from "@/lib/knowledge/schema";
import { DeletedItemsList } from "@/components/admin/deleted-items-list";
import { Button } from "@/components/ui/button";

// ISSUE-004課題1 / BR-DEL-002（SCR-ADM-011の削除済み一覧・復元画面）: 論理削除された図鑑項目の復元
export default async function Page() {
  const entries = await listDeletedEncyclopediaEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          削除済みの図鑑項目
        </h1>
        <Button href="/admin/encyclopedia" variant="ghost" size="sm">
          図鑑一覧に戻る
        </Button>
      </div>

      <DeletedItemsList
        domain="encyclopedia"
        items={entries.map((e) => ({
          ...e,
          title: e.title,
          meta: encyclopediaCategoryLabels[e.category],
        }))}
        emptyMessage="削除済みの図鑑項目はありません。"
      />
    </main>
  );
}
