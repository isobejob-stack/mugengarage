import { listAdminCustomers } from "@/lib/crm/queries";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-005: 顧客一覧
export default async function Page() {
  const customers = await listAdminCustomers();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        顧客一覧
      </h1>

      {customers.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
          登録された顧客はまだいません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {customers.map((c) => (
            <li key={c.id}>
              <Card href={`/admin/customers/${c.id}`}>
                <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-lg font-semibold text-charcoal-900">
                      {c.name}
                    </p>
                    <p className="text-base text-foreground-muted">
                      {[c.phone, c.email].filter(Boolean).join(" / ") ||
                        "連絡先未登録"}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
