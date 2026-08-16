import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  getAdminCustomerById,
  getCustomerFavoriteVehicles,
  getCustomerTimeline,
} from "@/lib/crm/queries";
import {
  inquiryCategoryLabels,
  inquiryChannelLabels,
} from "@/lib/crm/schema";
import { CustomerEditForm } from "@/components/crm/customer-edit-form";
import { CustomerNoteForm } from "@/components/crm/customer-note-form";
import { ReminderForm } from "@/components/crm/reminder-form";
import { ReminderToggle } from "@/components/crm/reminder-toggle";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import { Card, CardBody } from "@/components/ui/card";
import type { VehicleStatus } from "@/lib/inventory/types";

// UIUXレビュー指摘: セクションが同じ見た目のCardで5つ並ぶため、
// アイコンで種類を一目で判別できるようにする（55歳以上の非エンジニア運用者向け配慮）。
function SectionHeading({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h2 className="text-charcoal-900 flex items-center gap-2 font-serif text-lg font-bold">
      <span aria-hidden="true" className="text-primary-600">
        {icon}
      </span>
      {children}
    </h2>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d={path} />
    </svg>
  );
}

const ICON_PATHS = {
  customer: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  favorite:
    "M12 20.5s-7.5-4.6-9.5-8.7C1 8.3 2.6 5 6 5c2 0 3.3 1 4 2 0.7-1 2-2 4-2 3.4 0 5 3.3 3.5 6.8-2 4.1-9.5 8.7-9.5 8.7Z",
  note: "M6 3h9l3 3v15H6zM15 3v3h3M9 12h6M9 16h6",
  reminder:
    "M12 3a5 5 0 0 0-5 5v3.5L5 15h14l-2-3.5V8a5 5 0 0 0-5-5ZM10 19a2 2 0 0 0 4 0",
  timeline: "M12 8v4l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
} as const;

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
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        {customer.name}
      </h1>

      <section className="mt-6">
        <Card>
          <CardBody>
            <SectionHeading icon={<Icon path={ICON_PATHS.customer} />}>
              顧客情報
            </SectionHeading>
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
            <SectionHeading icon={<Icon path={ICON_PATHS.favorite} />}>
              お気に入り登録車両
              {favoriteVehicles.length > 0 &&
                `（${favoriteVehicles.length}件）`}
            </SectionHeading>
            {favoriteVehicles.length === 0 ? (
              <p className="text-foreground-muted mt-4 text-base">
                お気に入り登録した車両はまだありません。
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {favoriteVehicles.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/admin/vehicles/${v.id}/edit`}
                      className="ease-standard hover:border-primary-300 hover:bg-primary-50 flex flex-col gap-1 rounded-lg border border-neutral-200 p-3 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-charcoal-900 text-base font-semibold">
                          {v.manufacturers?.name} {v.models?.name}
                          {v.model_year ? `（${v.model_year}年）` : ""}
                        </span>
                        <VehicleStatusBadge
                          status={v.status as VehicleStatus}
                        />
                      </div>
                      <div className="text-foreground-muted flex items-center justify-between text-base">
                        <span>
                          お気に入り登録日:{" "}
                          {new Date(v.favoritedAt).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="text-primary-700 font-mono text-base font-bold">
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
            <SectionHeading icon={<Icon path={ICON_PATHS.note} />}>
              メモを追加
            </SectionHeading>
            <div className="mt-4">
              <CustomerNoteForm customerId={customer.id} />
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-6">
        <Card>
          <CardBody>
            <SectionHeading icon={<Icon path={ICON_PATHS.reminder} />}>
              リマインダーを追加
            </SectionHeading>
            <div className="mt-4">
              <ReminderForm customerId={customer.id} />
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="mt-8">
        <SectionHeading icon={<Icon path={ICON_PATHS.timeline} />}>
          タイムライン
        </SectionHeading>

        {timeline.length === 0 ? (
          <p className="text-foreground-muted mt-4 text-base">
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
                        <p className="text-foreground-muted text-base">
                          問い合わせ・{inquiryChannelLabels[entry.data.channel]}
                          ・
                          {inquiryCategoryLabels[entry.data.category]}・
                          {new Date(entry.data.received_at).toLocaleString(
                            "ja-JP",
                          )}
                        </p>
                        <p className="text-charcoal-900 mt-1 text-base whitespace-pre-wrap">
                          {entry.data.message}
                        </p>
                        <Link
                          href={`/admin/inquiries/${entry.data.id}`}
                          className="text-primary-700 mt-2 inline-block text-base hover:underline"
                        >
                          問い合わせ詳細を見る
                        </Link>
                      </div>
                    )}

                    {entry.type === "note" && (
                      <div>
                        <p className="text-foreground-muted text-base">
                          メモ・
                          {new Date(entry.data.created_at).toLocaleString(
                            "ja-JP",
                          )}
                        </p>
                        <p className="text-charcoal-900 mt-1 text-base whitespace-pre-wrap">
                          {entry.data.body}
                        </p>
                      </div>
                    )}

                    {entry.type === "reminder" && (
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-foreground-muted text-base">
                            リマインダー・期日 {entry.data.due_date}
                            {entry.data.is_completed && "（完了）"}
                          </p>
                          <p className="text-charcoal-900 mt-1 text-base">
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
