// 車両情報の表示文言を1箇所に集約する。
//
// 同じ項目を一覧・詳細・カードでそれぞれ組み立てていると、
// 「車検残」「車検満了」「車検」のような表記揺れが生まれる。
// 表示に使う文言はすべてここを通す。

export type ShakenStatus = "inspection_included" | "valid_until" | "none";

// 車検の表示文言。
// 満了日は年月までしか分からないことが多いため、日付が無ければ状態のみを返す。
export function formatShaken(
  status: string | null,
  expiry: string | null,
): string | null {
  if (status === "inspection_included") return "車検整備付";
  if (status === "none") return "車検なし";

  if (status === "valid_until") {
    if (!expiry) return "車検あり";
    const date = new Date(expiry);
    if (Number.isNaN(date.getTime())) return "車検あり";
    return `車検 ${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  // 状態が未設定でも、満了日だけが入っている既存データは活かす
  if (expiry) {
    const date = new Date(expiry);
    if (!Number.isNaN(date.getTime())) {
      return `車検 ${date.getFullYear()}年${date.getMonth() + 1}月`;
    }
  }

  return null;
}

// 走行距離。中古車サイトの慣例に合わせ、1万km以上は「◯.◯万km」と表記する。
// 187000 → 18.7万km / 8000 → 8,000km
export function formatMileage(km: number | null): string | null {
  if (km === null) return null;
  if (km >= 10000) {
    const man = Math.round(km / 1000) / 10;
    return `${man}万km`;
  }
  return `${km.toLocaleString()}km`;
}

export function formatModelYear(year: number | null): string | null {
  return year === null ? null : `${year}年`;
}

// 修復歴。「無し」を明示することに価値がある（購入検討者が必ず確認する項目のため）。
export function formatAccidentHistory(value: boolean | null): string | null {
  if (value === null) return null;
  return value ? "修復歴あり" : "修復歴なし";
}

export function formatLegalMaintenance(value: string | null): string | null {
  if (value === "included") return "法定整備付";
  if (value === "separate") return "法定整備別";
  if (value === "none") return "法定整備なし";
  return null;
}

export function formatWarranty(
  type: string | null,
  months: number | null,
  km: number | null,
): string | null {
  if (type === "without") return "保証なし";
  if (type !== "with") return null;

  const parts: string[] = [];
  if (months !== null) parts.push(`${months}ヶ月`);
  if (km !== null) parts.push(`${km.toLocaleString()}km`);

  return parts.length > 0 ? `保証付（${parts.join("・")}）` : "保証付";
}

export function formatSteeringSide(value: string | null): string | null {
  if (value === "right") return "右ハンドル";
  if (value === "left") return "左ハンドル";
  return null;
}

export function formatRecycleFee(value: string | null): string | null {
  if (value === "included") return "リサイクル料金込み";
  if (value === "separate") return "リサイクル料金別";
  if (value === "none") return "リサイクル料金なし";
  return null;
}

// ── ラベル付きの表（詳細ページの主要諸元）で使う「値だけ」の文言 ──────────
//
// 上の format 系は、カードのように単独で置かれても意味が通るよう項目名を含んでいる
// （例:「車検整備付」「法定整備付」）。一方、ラベルと並べる表で同じ文言を使うと
// 「車検：車検整備付」のように項目名が二重になる。表用はこちらを使う。

export function formatShakenValue(
  status: string | null,
  expiry: string | null,
): string | null {
  if (status === "inspection_included") return "車検整備付";
  if (status === "none") return "なし";

  const label = formatShaken(status, expiry);
  if (label === null) return null;
  // 「車検 2027年2月」→「2027年2月」、「車検あり」→「あり」
  return label.replace(/^車検\s?/, "") || "あり";
}

export function formatLegalMaintenanceValue(
  value: string | null,
): string | null {
  if (value === "included") return "付き";
  if (value === "separate") return "別途";
  if (value === "none") return "なし";
  return null;
}

export function formatWarrantyValue(
  type: string | null,
  months: number | null,
  km: number | null,
): string | null {
  if (type === "without") return "なし";
  if (type !== "with") return null;

  const parts: string[] = [];
  if (months !== null) parts.push(`${months}ヶ月`);
  if (km !== null) parts.push(`${km.toLocaleString()}km`);

  return parts.length > 0 ? `付き（${parts.join("・")}）` : "付き";
}

export function formatRecycleFeeValue(value: string | null): string | null {
  if (value === "included") return "込み";
  if (value === "separate") return "別途";
  if (value === "none") return "なし";
  return null;
}

export function formatSteeringSideValue(value: string | null): string | null {
  if (value === "right") return "右ハンドル";
  if (value === "left") return "左ハンドル";
  return null;
}
