import type { StatusBadgeTone } from "@/components/ui/status-badge";

// FR-CRM-004: リマインダーの期日を「期限切れ／今日／今週／それ以降」に分類する。
//
// 一覧（SCR-ADM-026）とダッシュボードの両方で同じ基準を使うため、画面から切り出して共通化する。
// due_date は date 型（YYYY-MM-DD、時刻を持たない）なので、比較も日付単位の文字列で行う。

export type ReminderUrgency = "overdue" | "today" | "soon" | "later";

// 「今週」とみなす日数。期日まで7日以内なら、そろそろ連絡の準備を始める必要がある。
const SOON_DAYS = 7;

// 店舗は日本国内で運用され、運用者にとっての「今日」は日本時間の今日である。
// 本番（Vercel）のサーバー時刻はUTCのため、素の new Date() で日付を作ると
// 日本時間の朝9時までは前日として扱われ、期日当日のリマインダーが「期限切れ」に見えてしまう。
// en-CA ロケールは YYYY-MM-DD 形式で返るため、date型の due_date とそのまま比較できる。
export function todayInJst(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

// YYYY-MM-DD を「UTC基準の通し日数」に変換する。
// Date.UTC を使うのは、サーバーのタイムゾーンや夏時間の影響を受けずに日数差を出すため。
function toDayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/** 期日まであと何日か。マイナスなら超過日数。 */
export function daysUntilDue(dueDate: string, today: string): number {
  return toDayNumber(dueDate) - toDayNumber(today);
}

export function classifyReminderDueDate(
  dueDate: string,
  today: string,
): ReminderUrgency {
  const days = daysUntilDue(dueDate, today);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= SOON_DAYS) return "soon";
  return "later";
}

// 03_ui_rules.md 7章: 色だけで情報を伝えない。バッジは必ず文字ラベルとセットで表示する。
export const REMINDER_URGENCY_PRESET: Record<
  ReminderUrgency,
  { label: string; tone: StatusBadgeTone }
> = {
  overdue: { label: "期限切れ", tone: "danger" },
  today: { label: "今日が期日", tone: "warning" },
  soon: { label: "今週中", tone: "info" },
  later: { label: "予定", tone: "neutral" },
};

/** 「3日超過」「あと5日」のように、期日までの距離を日本語で表す。 */
export function describeDueDate(dueDate: string, today: string): string {
  const days = daysUntilDue(dueDate, today);
  if (days < 0) return `${-days}日超過`;
  if (days === 0) return "今日";
  if (days === 1) return "明日";
  return `あと${days}日`;
}

/** 「8月20日（水）」形式。年をまたぐ期日だけ年を付ける。 */
export function formatDueDate(dueDate: string, today: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][
    new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  ];
  const yearPrefix = dueDate.slice(0, 4) === today.slice(0, 4) ? "" : `${year}年`;
  return `${yearPrefix}${month}月${day}日（${weekday}）`;
}
