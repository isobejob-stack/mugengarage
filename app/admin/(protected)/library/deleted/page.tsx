import { listDeletedLibraryEntries } from "@/lib/library/queries";
import { DeletedItemsList } from "@/components/admin/deleted-items-list";
import { Button } from "@/components/ui/button";

// ISSUE-004課題1 / BR-DEL-002（SCR-ADM-015の削除済み一覧・復元画面）: 論理削除されたライブラリ項目の復元
export default async function Page() {
  const entries = await listDeletedLibraryEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          削除済みのライブラリ項目
        </h1>
        <Button href="/admin/library" variant="ghost" size="sm">
          ライブラリ一覧に戻る
        </Button>
      </div>

      <DeletedItemsList
        domain="library"
        items={entries.map((e) => ({
          ...e,
          title: e.title,
          meta: e.category ?? undefined,
        }))}
        emptyMessage="削除済みのライブラリ項目はありません。"
      />
    </main>
  );
}
