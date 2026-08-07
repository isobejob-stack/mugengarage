import { listAdminArticles } from "@/lib/content/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-009: ブログ記事一覧（管理）
export default async function Page() {
  const articles = await listAdminArticles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          ブログ記事
        </h1>
        <div className="flex items-center gap-3">
          <Button href="/admin/articles/deleted" variant="ghost" size="sm">
            削除済みを見る
          </Button>
          <Button href="/admin/articles/new" variant="primary" size="md">
            新規作成
          </Button>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
          記事はまだありません。
        </p>
      ) : (
        <Card className="mt-6">
          <CardBody className="p-4">
            <ul className="flex flex-col divide-y divide-neutral-100">
              {articles.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-base font-medium text-charcoal-900">
                    {a.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      label={a.status === "published" ? "公開" : "下書き"}
                      tone={a.status === "published" ? "success" : "neutral"}
                    />
                    <Button
                      href={`/admin/articles/${a.id}/edit`}
                      variant="outline"
                      size="sm"
                    >
                      編集
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
