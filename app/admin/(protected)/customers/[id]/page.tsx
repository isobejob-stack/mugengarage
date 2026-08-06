import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminCustomerById, getCustomerTimeline } from "@/lib/crm/queries";
import { inquiryCategoryLabels } from "@/lib/crm/schema";
import { CustomerEditForm } from "@/components/crm/customer-edit-form";
import { CustomerNoteForm } from "@/components/crm/customer-note-form";
import { ReminderForm } from "@/components/crm/reminder-form";
import { ReminderToggle } from "@/components/crm/reminder-toggle";

const channelLabels: Record<string, string> = {
  line: "LINE",
  phone: "電話",
  email: "メール",
  form: "フォーム",
};

// SCR-ADM-006: 顧客詳細（問い合わせ・メモ・リマインダーを時系列表示、FR-CRM-002〜005）
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, timeline] = await Promise.all([
    getAdminCustomerById(id),
    getCustomerTimeline(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">{customer.name}</h1>

      <section className="mt-6 rounded-md border border-neutral-200 p-4">
        <h2 className="text-lg font-bold">顧客情報</h2>
        <div className="mt-4">
          <CustomerEditForm
            customerId={customer.id}
            defaultValues={{
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              notes: customer.notes,
            }}
          />
        </div>
      </section>

      <section className="mt-6 rounded-md border border-neutral-200 p-4">
        <h2 className="text-lg font-bold">メモを追加</h2>
        <div className="mt-4">
          <CustomerNoteForm customerId={customer.id} />
        </div>
      </section>

      <section className="mt-6 rounded-md border border-neutral-200 p-4">
        <h2 className="text-lg font-bold">リマインダーを追加</h2>
        <div className="mt-4">
          <ReminderForm customerId={customer.id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">タイムライン</h2>

        {timeline.length === 0 ? (
          <p className="mt-4 text-neutral-500">まだ履歴がありません。</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {timeline.map((entry) => (
              <li
                key={`${entry.type}:${entry.data.id}`}
                className="rounded-md border border-neutral-200 p-4"
              >
                {entry.type === "inquiry" && (
                  <div>
                    <p className="text-sm text-neutral-500">
                      問い合わせ・{channelLabels[entry.data.channel]}・
                      {inquiryCategoryLabels[entry.data.category]}・
                      {new Date(entry.data.received_at).toLocaleString("ja-JP")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {entry.data.message}
                    </p>
                    <Link
                      href={`/admin/inquiries/${entry.data.id}`}
                      className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                    >
                      問い合わせ詳細を見る
                    </Link>
                  </div>
                )}

                {entry.type === "note" && (
                  <div>
                    <p className="text-sm text-neutral-500">
                      メモ・
                      {new Date(entry.data.created_at).toLocaleString("ja-JP")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {entry.data.body}
                    </p>
                  </div>
                )}

                {entry.type === "reminder" && (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-neutral-500">
                        リマインダー・期日 {entry.data.due_date}
                        {entry.data.is_completed && "（完了）"}
                      </p>
                      <p className="mt-1">{entry.data.title}</p>
                    </div>
                    <ReminderToggle
                      reminderId={entry.data.id}
                      isCompleted={entry.data.is_completed}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
