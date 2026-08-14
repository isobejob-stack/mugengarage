import { listAdminLibraryEntries } from "@/lib/library/queries";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-015: ライブラリ管理一覧
export default async function Page() {
  const entries = await listAdminLibraryEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          ライブラリ
        </h1>
        <div className="flex items-center gap-3">
          <Button href="/admin/library/deleted" variant="ghost" size="sm">
            削除済みを見る
          </Button>
          <Button href="/admin/library/new" variant="primary" size="md">
            新規作成
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-foreground-muted mt-8 text-base">
          ライブラリ項目はまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map((e) => (
            <li key={e.id}>
              <Card>
                <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
                  <div>
                    {e.category && (
                      <p className="text-foreground-muted text-base">
                        {e.category}
                      </p>
                    )}
                    <p className="text-charcoal-900 text-lg font-semibold">
                      {e.title}
                    </p>
                  </div>
                  <Button
                    href={`/admin/library/${e.id}/edit`}
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
