import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAdminCustomerById,
  getCustomerFavoriteVehicles,
  getCustomerTimeline,
} from "@/lib/crm/queries";
import { inquiryCategoryLabels } from "@/lib/crm/schema";
import { CustomerEditForm } from "@/components/crm/customer-edit-form";
import { CustomerNoteForm } from "@/components/crm/customer-note-form";
import { ReminderForm } from "@/components/crm/reminder-form";
import { ReminderToggle } from "@/components/crm/reminder-toggle";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import { Card, CardBody } from "@/components/ui/card";
import type { VehicleStatus } from "@/lib/inventory/types";

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
  const [customer, timeline, favoriteVehicles] = await Promise.all([
    getAdminCustomerById(id),
    getCustomerTimeline(id),
    getCustomerFavoriteVehicles(id),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        {customer.name}
      </h1>

      <section className="mt-6">
        <Card>
          <CardBody>
            <h2 className="font-serif text-lg font-bold text-charcoal-900">
              顧客情報
            </h2>
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
          </CardBody>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardBody>
            <h2 className="font-serif text-lg font-bold text-charcoal-900">
              お気に入り登録車両
              {favoriteVehicles.length > 0 && `（${favoriteVehicles.length}件）`}
            </h2>
            {favoriteVehicles.length === 0 ? (
              <p className="mt-4 text-base text-foreground-muted">
                お気に入り登録した車両はまだありません。
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {favoriteVehicles.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/admin/vehicles/${v.id}/edit`}
                      className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-3 transition-colors duration-200 ease-standard hover:border-primary-300 hover:bg-primary-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-base font-semibold text-charcoal-900">
                          {v.manufacturers?.name} {v.models?.name}
                          {v.model_year ? `（${v.model_year}年）` : ""}
                        </span>
                        <VehicleStatusBadge status={v.status as VehicleStatus} />
                      </div>
                      <div className="flex items-center justify-between text-base text-foreground-muted">
                        <span>
                          お気に入り登録日:{" "}
                          {new Date(v.favoritedAt).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="font-mono text-base font-bold text-primary-700">
                          ¥{v.price.toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardBody>
            <h2 className="font-serif text-lg font-bold text-charcoal-900">
              メモを追加
            </h2>
            <div className="mt-4">
              <CustomerNoteForm customerId={customer.id} />
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardBody>
            <h2 className="font-serif text-lg font-bold text-charcoal-900">
              リマインダーを追加
            </h2>
            <div className="mt-4">
              <ReminderForm customerId={customer.id} />
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-lg font-bold text-charcoal-900">
          タイムライン
        </h2>

        {timeline.length === 0 ? (
          <p className="mt-4 text-base text-foreground-muted">
            まだ履歴がありません。
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {timeline.map((entry) => (
              <li key={`${entry.type}:${entry.data.id}`}>
                <Card>
                  <CardBody className="p-4">
                    {entry.type === "inquiry" && (
                      <div>
                        <p className="text-base text-foreground-muted">
                          問い合わせ・{channelLabels[entry.data.channel]}・
                          {inquiryCategoryLabels[entry.data.category]}・
                          {new Date(entry.data.received_at).toLocaleString(
                            "ja-JP",
                          )}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-base text-charcoal-900">
                          {entry.data.message}
                        </p>
                        <Link
                          href={`/admin/inquiries/${entry.data.id}`}
                          className="mt-2 inline-block text-base text-primary-700 hover:underline"
                        >
                          問い合わせ詳細を見る
                        </Link>
                      </div>
                    )}

                    {entry.type === "note" && (
                      <div>
                        <p className="text-base text-foreground-muted">
                          メモ・
                          {new Date(entry.data.created_at).toLocaleString(
                            "ja-JP",
                          )}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-base text-charcoal-900">
                          {entry.data.body}
                        </p>
                      </div>
                    )}

                    {entry.type === "reminder" && (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base text-foreground-muted">
                            リマインダー・期日 {entry.data.due_date}
                            {entry.data.is_completed && "（完了）"}
                          </p>
                          <p className="mt-1 text-base text-charcoal-900">
                            {entry.data.title}
                          </p>
                        </div>
                        <ReminderToggle
                          reminderId={entry.data.id}
                          isCompleted={entry.data.is_completed}
                        />
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
