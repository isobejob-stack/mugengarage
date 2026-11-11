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

// ラベルと並べる表に入れる値。「修復歴」というラベルの隣に置くので項目名を含めない
// （formatAccidentHistory は「修復歴なし」とラベル込みで返す。用途が違う）。
export function formatAccidentHistoryValue(
  value: boolean | null,
): string | null {
  if (value === null) return null;
  return value ? "あり" : "なし";
}

export function formatLegalMaintenanceValue(
  value: string | null,
): string | null {
  if (value === "included") return "付き";
  if (value === "separate") return "別途";
  if (value === "none") return "なし";
  return null;
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

// ── 車名（掲載の見出し） ─────────────────────────────────────────────────
//
// 車選びドットコムから取り込んだ車両は、販売コメントの1行目に掲載の見出しが太字で入っている
// （例: 「**ダブルシックス 特注ワイヤーホイール**」「**XJ6-3.2 ワンオーナー車、**」）。
// 車名の登録は「メーカー：ディムラー／車種：ディムラー」のように掲載の表記のままなので（店主の指示）、
// 見出しを使わないと、ページのタイトルが「ディムラー ディムラー（1990年）」になり、
// 「ダブルシックス」「XJ6」といった、探す人が実際に打ち込む言葉がどこにも出てこない。
// 見出しは掲載と同じ表記であり、店主の「掲載の表記のまま」という方針にも沿う。
//
// 販売コメントが太字の短い1行で始まる場合だけ見出しとみなす（手入力の車両には無いことが多い）。
export function extractListingHeadline(
  salesComment: string | null,
): string | null {
  if (!salesComment) return null;
  const match = salesComment.trimStart().match(/^\*\*([^*\n]{1,60})\*\*/);
  if (!match) return null;
  // 掲載の見出しには「ワンオーナー車、」のように末尾の読点が残っているものがある
  const headline = match[1].trim().replace(/[、,。．.\s]+$/u, "");
  return headline || null;
}

// 見出しを取り除いた販売コメント（説明文の抜粋に使う。見出しと同じ文言を二度並べないため）
export function stripListingHeadline(salesComment: string | null): string {
  if (!salesComment) return "";
  return salesComment.trimStart().replace(/^\*\*[^*\n]{1,60}\*\*\s*/, "");
}

// 掲載の見出しを「車名の続き（グレード）」と「売り文句（装備・状態など）」に分ける（2026-11-11）。
//
// 掲載の見出しは「グレード＋売り文句」がひと続きになっている。
//   「ダブルシックス 特注ワイヤーホイール」→ ダブルシックス ／ 特注ワイヤーホイール
//   「XJ6-3.2 40型/丸型4灯ライト/革×布シート」→ XJ6-3.2 ／ 40型・丸型4灯ライト・革×布シート
//   「XJR 4.0 スーパーチャージド スーパーチャージャー」→ XJR 4.0 スーパーチャージド ／ スーパーチャージャー
// 全部をタイトルに入れると長く読みにくいため、タイトルには車名（グレード）までを使い、
// 売り文句は本文（車名の下の一行）に回す。
//
// 先頭から順に、グレードらしい語（英数字の型式・排気量、下の一覧にあるグレード名）が続くあいだを車名とみなし、
// それ以外の語（漢字・かなを含む語、「/」区切りの装備の列挙、一覧に無い片仮名語）が出たところから売り文句とする。
// 一覧に無いグレード名は売り文句の側に入るが、本文には必ず出るので情報は落ちない。
const GRADE_WORDS = new Set([
  "ダブルシックス",
  "マジェスティック",
  "ソブリン",
  "ソヴリン",
  "ヴァンデンプラ",
  "バンデンプラ",
  "エグゼクティブ",
  "ポートフォリオ",
  "スーパーチャージド",
  "アバンギャルド",
  "エレガンス",
  "ラグジュアリー",
  "プレミアム",
  "スポーツ",
  "クーペ",
  "コンバーチブル",
  "カブリオレ",
]);

// 英数字だけの語でも、装備の略称は車名に入れない（「ETC」「HID」など）
const EQUIPMENT_ABBREVIATIONS = new Set([
  "ETC",
  "HID",
  "LED",
  "DVD",
  "CD",
  "MD",
  "HDD",
  "ABS",
  "AW",
  "SR",
  "TV",
  "USB",
]);

function isGradeToken(token: string): boolean {
  if (GRADE_WORDS.has(token)) return true;
  if (EQUIPMENT_ABBREVIATIONS.has(token.toUpperCase())) return false;
  return /^[A-Za-z0-9][A-Za-z0-9.\-+]*$/.test(token);
}

export function splitListingHeadline(headline: string | null): {
  grade: string | null;
  catchPhrase: string | null;
} {
  if (!headline) return { grade: null, catchPhrase: null };
  const tokens = headline.trim().split(/\s+/);
  const grade: string[] = [];
  let rest: string[] = tokens;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (isGradeToken(token)) {
      grade.push(token);
      continue;
    }
    // 「4.2/シリーズ3/青革」のように、車名の続き（4.2）に装備の列挙がくっついている語は、
    // 先頭だけ車名に入れる。ただし車名がまだ1語も無いとき（「ETC/本革シート」）はすべて売り文句
    const [head, ...tail] = token.split("/");
    if (grade.length > 0 && tail.length > 0 && isGradeToken(head)) {
      grade.push(head);
      rest = [tail.join("/"), ...tokens.slice(i + 1)];
    } else {
      rest = tokens.slice(i);
    }
    break;
  }
  if (rest === tokens) rest = [];

  // 装備の列挙は「/」区切りで書かれている。本文では「・」で読みやすくする
  const catchPhrase = rest
    .join(" ")
    .replace(/\s*\/\s*/g, "・")
    .trim();
  return {
    grade: grade.length > 0 ? grade.join(" ") : null,
    catchPhrase: catchPhrase || null,
  };
}

// 車両の呼び名（タイトル・見出し・一覧のカードで共通）と、本文に回す売り文句。
//
// 車名は「メーカー 車種 グレード」。取り込んだ車両は掲載の表記のまま登録してあるため
// 「ディムラー ディムラー」「ジャガー XJ XJ6-3.2」のように同じ語が重なる。読みやすさのため、
// 車種がメーカー名と同じとき、または車種とグレードの頭が重なるとき（XJ と XJ6-3.2、XJ-Sクーペ と XJ-S V12）は
// 車種を省く（「ディムラー ダブルシックス」「ジャガー XJ6-3.2」「ジャガー XJ-S V12」）。
// グレードは掲載の見出しから取り、無ければ登録されたグレード名を使う。
export function buildVehicleNameParts(vehicle: {
  manufacturers: { name: string } | null;
  models: { name: string } | null;
  grades?: { name: string } | null;
  sales_comment?: string | null;
}): { name: string; catchPhrase: string | null } {
  const maker = vehicle.manufacturers?.name ?? null;
  const model = vehicle.models?.name ?? null;
  const { grade: headlineGrade, catchPhrase } = splitListingHeadline(
    extractListingHeadline(vehicle.sales_comment ?? null),
  );
  const grade = headlineGrade ?? vehicle.grades?.name ?? null;

  const gradeHead = grade?.split(/\s+/)[0] ?? null;
  const modelIsRedundant =
    model !== null &&
    (model === maker ||
      (grade !== null &&
        gradeHead !== null &&
        (grade.startsWith(model) || model.startsWith(gradeHead))));

  const name = [maker, modelIsRedundant ? null : model, grade]
    .filter(Boolean)
    .join(" ");
  return { name, catchPhrase };
}

export function buildVehicleName(
  vehicle: Parameters<typeof buildVehicleNameParts>[0],
): string {
  return buildVehicleNameParts(vehicle).name;
}

// 金額を「410万円」「405.5万円」の形にする（検索結果の説明文向け。1万円未満は切り捨てない）
export function formatManYen(yen: number): string {
  const man = yen / 10000;
  const text = Number.isInteger(man)
    ? man.toLocaleString()
    : (Math.round(man * 10) / 10).toLocaleString();
  return `${text}万円`;
}
