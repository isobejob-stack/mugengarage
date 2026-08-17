import Link from "next/link";
import { listAdminInquiries, listOpenReminders } from "@/lib/crm/queries";
import { getAdminFavoriteCounts } from "@/lib/engagement/queries";
import {
  REMINDER_URGENCY_PRESET,
  classifyReminderDueDate,
  describeDueDate,
  formatDueDate,
  todayInJst,
} from "@/lib/crm/reminders";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

const shortcuts = [
  { label: "車両を登録する", href: "/admin/vehicles/new" },
  { label: "問い合わせを手動で登録する", href: "/admin/inquiries/new" },
  { label: "記事を書く", href: "/admin/articles/new" },
  { label: "図鑑項目を追加する", href: "/admin/encyclopedia/new" },
  { label: "年表イベントを追加する", href: "/admin/timeline/new" },
  { label: "ライブラリ項目を追加する", href: "/admin/library/new" },
  // 整備実績はブログへ統合した（ADR-002）。整備の記録は
  // カテゴリ「整備記録」の記事として書くため、行き先は記事の新規作成にする。
  { label: "整備の記録を書く", href: "/admin/articles/new" },
] as const;

// ダッシュボードに出す「対応期日が近い顧客」の件数。
// 一覧で全件見られるので、ここは「今日開いて最初に目に入る数件」に絞る。
const DUE_SOON_DISPLAY_COUNT = 5;

// SCR-ADM-002: ダッシュボード（未対応問い合わせ件数・対応期日・よく使う操作へのショートカット）
export default async function Page() {
  const [inquiries, reminders, favoriteCounts] = await Promise.all([
    listAdminInquiries(),
    // 未完了のリマインダーのみが対象で件数はたかが知れているため、
    // 件数の集計と表示用の抜粋を1回の取得でまかなう
    listOpenReminders(),
    getAdminFavoriteCounts(5),
  ]);

  const unhandledCount = inquiries.filter(
    (i) => i.response_status === "unhandled",
  ).length;

  const today = todayInJst();
  // 「期限切れ」と「今日が期日」は、今日中に何かしないと約束を破ることになる件数
  const needsActionCount = reminders.filter((r) =>
    ["overdue", "today"].includes(classifyReminderDueDate(r.due_date, today)),
  ).length;
  const dueSoon = reminders.slice(0, DUE_SOON_DISPLAY_COUNT);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        ダッシュボード
      </h1>

      {/* 「未対応の問い合わせ」と「対応期日」は、どちらも放置すると顧客との関係が切れる指標。
          運用者が朝いちばんに見る場所なので、同じ形・同じ並びで横に置く。 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card href="/admin/inquiries" className="hover:-translate-y-0.5">
          <CardBody className="flex flex-row items-center justify-between gap-4 p-6">
            <div>
              <p className="text-foreground-muted text-base">
                未対応の問い合わせ
              </p>
              <p
                className={`mt-1 text-4xl font-bold tabular-nums ${
                  unhandledCount > 0 ? "text-red-600" : "text-charcoal-900"
                }`}
              >
                {unhandledCount}件
              </p>
            </div>
            <StatusBadge
              label={unhandledCount > 0 ? "対応が必要です" : "対応済み"}
              tone={unhandledCount > 0 ? "danger" : "success"}
            />
          </CardBody>
        </Card>

        <Card href="/admin/reminders" className="hover:-translate-y-0.5">
          <CardBody className="flex flex-row items-center justify-between gap-4 p-6">
            <div>
              <p className="text-foreground-muted text-base">
                期日が過ぎた・今日が期日
              </p>
              <p
                className={`mt-1 text-4xl font-bold tabular-nums ${
                  needsActionCount > 0 ? "text-red-600" : "text-charcoal-900"
                }`}
              >
                {needsActionCount}件
              </p>
            </div>
            <StatusBadge
              label={needsActionCount > 0 ? "連絡が必要です" : "期日超過なし"}
              tone={needsActionCount > 0 ? "danger" : "success"}
            />
          </CardBody>
        </Card>
      </div>

      {dueSoon.length > 0 && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-charcoal-900 font-serif text-lg font-bold">
              対応期日が近い顧客
            </h2>
            <Link
              href="/admin/reminders"
              className="text-primary-700 inline-flex min-h-11 items-center text-base hover:underline"
            >
              リマインダーをすべて見る（{reminders.length}件）
            </Link>
          </div>
          <Card className="mt-3">
            <CardBody className="p-4">
              <ul className="flex flex-col divide-y divide-neutral-100">
                {dueSoon.map((reminder) => {
                  const preset =
                    REMINDER_URGENCY_PRESET[
                      classifyReminderDueDate(reminder.due_date, today)
                    ];
                  return (
                    <li key={reminder.id} className="first:pt-0 last:pb-0">
                      <Link
                        href={`/admin/customers/${reminder.customers.id}`}
                        className="ease-standard hover:bg-primary-50 flex min-h-11 flex-col gap-1 rounded-lg px-2 py-3 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-charcoal-900 text-base font-semibold">
                          {reminder.customers.name}
                          <span className="text-foreground-muted ml-2 font-normal">
                            {reminder.title}
                          </span>
                        </span>
                        <span className="flex flex-shrink-0 items-center gap-2">
                          <span className="text-foreground-muted text-base">
                            {formatDueDate(reminder.due_date, today)}・
                            {describeDueDate(reminder.due_date, today)}
                          </span>
                          <StatusBadge label={preset.label} tone={preset.tone} />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>
        </>
      )}

      {favoriteCounts.length > 0 && (
        <>
          <h2 className="text-charcoal-900 mt-8 font-serif text-lg font-bold">
            お気に入り登録数（上位）
          </h2>
          <Card className="mt-3">
            <CardBody className="p-4">
              <ul className="flex flex-col divide-y divide-neutral-100">
                {favoriteCounts.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-4 py-3 text-base first:pt-0 last:pb-0"
                  >
                    <span className="text-charcoal-900">
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </span>
                    <span className="text-primary-700 font-mono font-semibold">
                      ♥ {v.favoriteCount}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </>
      )}

      <h2 className="text-charcoal-900 mt-8 font-serif text-lg font-bold">
        よく使う操作
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Button
            key={s.href}
            href={s.href}
            variant="outline"
            size="md"
            className="w-full justify-center"
          >
            {s.label}
          </Button>
        ))}
      </div>
    </main>
  );
}
