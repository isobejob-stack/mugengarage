import Link from "next/link";
import { listAdminCustomers } from "@/lib/crm/queries";

// SCR-ADM-005: 顧客一覧
export default async function Page() {
  const customers = await listAdminCustomers();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">顧客一覧</h1>

      {customers.length === 0 ? (
        <p className="mt-8 text-neutral-500">登録された顧客はまだいません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {customers.map((c) => (
            <li key={c.id} className="rounded-md border border-neutral-200 p-4">
              <Link
                href={`/admin/customers/${c.id}`}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-neutral-500">
                    {[c.phone, c.email].filter(Boolean).join(" / ") ||
                      "連絡先未登録"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
