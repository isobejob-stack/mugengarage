import { listDeletedArticles } from "@/lib/content/queries";
import { DeletedItemsList } from "@/components/admin/deleted-items-list";
import { Button } from "@/components/ui/button";

// ISSUE-004課題1 / BR-DEL-002（SCR-ADM-009の削除済み一覧・復元画面）: 論理削除された記事の復元
export default async function Page() {
  const articles = await listDeletedArticles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          削除済みの記事
        </h1>
        <Button href="/admin/articles" variant="ghost" size="sm">
          記事一覧に戻る
        </Button>
      </div>

      <DeletedItemsList
        domain="articles"
        items={articles.map((a) => ({
          ...a,
          title: a.title,
          meta: a.status === "published" ? "公開" : "下書き",
        }))}
        emptyMessage="削除済みの記事はありません。"
      />
    </main>
  );
}
