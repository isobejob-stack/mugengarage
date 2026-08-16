import type { TimelineDatePrecision } from "@/lib/knowledge/types";

// 年表の日付・年代の表示ヘルパ。
//
// event_date は常に YYYY-MM-DD で入っているが、date_precision に
// 「その日付をどこまで信頼してよいか」が入っている。出典が二次資料しかない
// 出来事は、意図的に月精度・年精度へ落としてある（docs/tasks/CONTENT_FACTCHECK.md）。
// 従来の公開画面は "1936-01-01" と生の値をそのまま出していたため、
// 年しか分かっていない出来事まで日付が確定しているように見えていた。
// 表示側で精度に合わせて丸める。

export function timelineYearOf(eventDate: string): number {
  return Number(eventDate.slice(0, 4));
}

export function decadeLabelOf(eventDate: string): string {
  const year = timelineYearOf(eventDate);
  return `${Math.floor(year / 10) * 10}年代`;
}

export function formatTimelineDate(
  eventDate: string,
  precision: TimelineDatePrecision,
): string {
  const [year, month, day] = eventDate.split("-").map(Number);
  // 想定外の値でも画面を落とさない（管理画面からの入力を経由する値のため）
  if (!year) return eventDate;
  if (precision === "year" || !month) return `${year}年`;
  if (precision === "month" || !day) return `${year}年${month}月`;
  return `${year}年${month}月${day}日`;
}
