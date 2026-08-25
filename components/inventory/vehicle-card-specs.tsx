import {
  formatShakenValue,
  formatMileage,
  formatModelYear,
  formatAccidentHistoryValue,
} from "@/lib/inventory/display";

// 一覧カードに出す主要スペック。
//
// 従来カードは「車名・年式・価格」しか無く、年式以外の比較材料が詳細ページにしか無かった。
// カーセンサー・グーネット等は一覧の段階で「年式 / 走行距離 / 車検 / 修復歴」を出しており、
// これは1台ずつ詳細を開かなくても比較できるようにするための設計。
// 年齢層の高い利用者ほどページ往復の負担が大きいため、一覧で判断できる価値が高い
// （docs/tasks/ISSUE-006）。
//
// 未設定の項目は行ごと出さない。空欄や「-」を並べると情報が無いことが強調され、
// かえって不信感につながるため。
//
// 表示形式について（2026-08-25変更）:
// 以前は項目を横に並べ、区切りを after:content-['|'] で出していた。
// これは flex-wrap で折り返したときに **区切り記号だけが行末に取り残される**。
// 「1990年 │ 5.9万km │」「車検整備付 │」のように、意味のない縦線がカード内に浮く。
// 発注者から「謎の空白線みたいなので気持ち悪い」と指摘されたのはこれ。
//
// これは工夫では解けない。折り返し位置は <li> 単位で決まるので、行末に来た <li> の
// ::after は必ず行末に残る。「折り返した直後の要素」を選ぶCSSセレクタは存在しない。
// そこで区切り記号をやめ、ラベルと値の2列に組み直す。
//
//     年式    1990年
//     走行    5.9万km
//     車検    整備付
//     修復歴  なし
//
// 副次的な利点:
//   - 値の縦位置が揃うので、隣のカードと見比べやすい
//   - 「車検整備付」「修復歴なし」のように値へ項目名が埋まっていたのを分離できる
//     （formatShakenValue は状態次第で「2027年2月」も返すため、
//       ラベルが無いと同じ位置に違う文型が混ざって読み替えの負担になる）
//   - dl/dt/dd は読み上げで「年式、1990年」と名前と値の組として読まれる
export function VehicleCardSpecs({
  modelYear,
  mileageKm,
  shakenStatus,
  shakenExpiry,
  accidentHistory,
}: {
  modelYear: number | null;
  mileageKm: number | null;
  shakenStatus: string | null;
  shakenExpiry: string | null;
  accidentHistory: boolean | null;
}) {
  const rows = [
    ["年式", formatModelYear(modelYear)],
    ["走行", formatMileage(mileageKm)],
    ["車検", formatShakenValue(shakenStatus, shakenExpiry)],
    ["修復歴", formatAccidentHistoryValue(accidentHistory)],
  ].filter((row): row is [string, string] => row[1] !== null);

  if (rows.length === 0) return null;

  return (
    // leading-snug は行間を詰めるための指定。globals.css の body で line-height: 1.75 を
    // 敷いているため、そのままだと4行で100px近くを占め、1画面に入る台数が減る。
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-sm leading-snug sm:gap-y-1 sm:text-base">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-foreground-muted">{label}</dt>
          <dd className="text-charcoal-900 font-medium tabular-nums">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
