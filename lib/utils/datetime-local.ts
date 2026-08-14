// レビュー指摘対応（必須修正1・2）: <input type="datetime-local"> はタイムゾーン情報を持たない
// 「ブラウザのローカル時刻」文字列（例: "2026-08-06T09:00"）を扱う一方、DB（scheduled_publish_at,
// timestamptz）にはUTCのISO文字列を保存している。この2つを変換なしで直接やり取りすると、
// - 送信時：ローカル時刻の文字列がそのままUTCとして保存され、実際の公開時刻がJSTからずれる
// - 表示時：DBのオフセット付きISO文字列はdatetime-localのvalueとして受理されず、既存の
//   予約日時が編集画面に表示されない
// という2つの不具合が発生する。本ユーティリティで相互変換を一箇所に集約する。
// FR-INV-007 / FR-BLOG-004（公開予約機能）で使用する。

/**
 * DBから取得したUTCのISO文字列（例: "2026-08-06T00:00:00+00:00"）を、
 * <input type="datetime-local"> がvalueとして受理できる形式
 * （タイムゾーン情報なしの "YYYY-MM-DDTHH:mm"、ブラウザのローカル時刻）に変換する。
 * null・空文字・不正な値の場合は空文字を返す（未入力として扱う）。
 */
export function toDatetimeLocalValue(
  isoString: string | null | undefined,
): string {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * <input type="datetime-local"> の値（タイムゾーン情報なし、ブラウザのローカル時刻の文字列）を、
 * DB（timestamptz）へ保存するためのUTC ISO文字列に変換する。
 * 空文字（未入力・予約解除して保存した場合）はnullを返す（必須修正2）。
 */
export function fromDatetimeLocalValue(
  localValue: string | null | undefined,
): string | null {
  if (!localValue) return null;

  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}
