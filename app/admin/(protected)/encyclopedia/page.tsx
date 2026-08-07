import { listAdminEncyclopediaEntries } from "@/lib/knowledge/queries";
import { encyclopediaCategoryLabels } from "@/lib/knowledge/schema";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-011: 図鑑管理一覧
export default async function Page() {
  const entries = await listAdminEncyclopediaEntries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          Jaguar図鑑
        </h1>
        <Button href="/admin/encyclopedia/new" variant="primary" size="md">
          新規作成
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
          図鑑項目はまだありません。
        </p>
      ) : (
        <Card className="mt-6">
          <CardBody className="p-4">
            <ul className="flex flex-col divide-y divide-neutral-100">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-base text-foreground-muted">
                      {encyclopediaCategoryLabels[e.category]}
                    </p>
                    <p className="text-base font-medium text-charcoal-900">
                      {e.title}
                    </p>
                  </div>
                  <Button
                    href={`/admin/encyclopedia/${e.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    編集
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
