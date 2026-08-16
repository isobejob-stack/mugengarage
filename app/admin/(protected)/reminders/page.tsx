import Link from "next/link";
import { listOpenReminders } from "@/lib/crm/queries";
import {
  REMINDER_URGENCY_PRESET,
  classifyReminderDueDate,
  describeDueDate,
  formatDueDate,
  todayInJst,
} from "@/lib/crm/reminders";
import { ReminderToggle } from "@/components/crm/reminder-toggle";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

// SCR-ADM-026（新設）: リマインダー横断一覧（FR-CRM-004）。
//
// リマインダーは顧客詳細の中にしか無く、期日を確認するには顧客を1件ずつ開く必要があった。
// 「車検時期に連絡する」類の約束は、期日を過ぎた時点で機能そのものが無意味になるため、
// 全顧客ぶんを期日順に並べた入口を用意する。
export default async function Page() {
  const reminders = await listOpenReminders();
  const today = todayInJst();

  const overdueCount = reminders.filter(
    (r) => classifyReminderDueDate(r.due_date, today) === "overdue",
  ).length;
  const todayCount = reminders.filter(
    (r) => classifyReminderDueDate(r.due_date, today) === "today",
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        リマインダー
      </h1>
      <p className="text-foreground-muted mt-2 text-base">
        未完了のリマインダーを期日が近い順に表示しています。
      </p>

      {reminders.length === 0 ? (
        <p className="text-foreground-muted mt-8 text-base">
          未完了のリマインダーはありません。
          リマインダーは顧客詳細ページから追加できます。
        </p>
      ) : (
        <>
          <p className="text-charcoal-900 mt-4 text-base">
            全{reminders.length}件
            {overdueCount > 0 && (
              <span className="ml-2 font-semibold text-red-700">
                （期限切れ {overdueCount}件）
              </span>
            )}
            {todayCount > 0 && (
              <span className="ml-2 font-semibold text-amber-700">
                （今日が期日 {todayCount}件）
              </span>
            )}
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {reminders.map((reminder) => {
              const urgency = classifyReminderDueDate(reminder.due_date, today);
              const preset = REMINDER_URGENCY_PRESET[urgency];

              return (
                <li key={reminder.id}>
                  <Card
                    // 左端の色帯は補助。期限切れ・今日は必ずバッジの文字でも示す（03_ui_rules.md 7章）
                    className={
                      urgency === "overdue"
                        ? "border-l-4 border-l-red-500"
                        : urgency === "today"
                          ? "border-l-4 border-l-amber-500"
                          : ""
                    }
                  >
                    <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge label={preset.label} tone={preset.tone} />
                          <span className="text-charcoal-900 text-base font-medium">
                            {formatDueDate(reminder.due_date, today)}
                          </span>
                          <span className="text-foreground-muted text-base">
                            （{describeDueDate(reminder.due_date, today)}）
                          </span>
                        </div>
                        <p className="text-charcoal-900 mt-2 text-lg font-semibold">
                          {reminder.title}
                        </p>
                        {/* 誰への連絡かが分からないと動けないので、顧客詳細へ直接飛べるようにする */}
                        <Link
                          href={`/admin/customers/${reminder.customers.id}`}
                          className="text-primary-700 mt-1 inline-flex min-h-11 items-center text-base hover:underline"
                        >
                          {reminder.customers.name} さんの顧客ページを開く
                        </Link>
                      </div>

                      <ReminderToggle
                        reminderId={reminder.id}
                        isCompleted={reminder.is_completed}
                      />
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
