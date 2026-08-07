import { listAdminLibraryEntries } from "@/lib/library/queries";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-015: ライブラリ管理一覧
export default async function Page() {
  const entries = await listAdminLibraryEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          ライブラリ
        </h1>
        <Button href="/admin/library/new" variant="primary" size="md">
          新規作成
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
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
                      <p className="text-base text-foreground-muted">
                        {e.category}
                      </p>
                    )}
                    <p className="text-lg font-semibold text-charcoal-900">
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
