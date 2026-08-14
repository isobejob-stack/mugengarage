import {
  formatShaken,
  formatMileage,
  formatModelYear,
  formatAccidentHistory,
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
  const specs = [
    formatModelYear(modelYear),
    formatMileage(mileageKm),
    formatShaken(shakenStatus, shakenExpiry),
    formatAccidentHistory(accidentHistory),
  ].filter((v): v is string => v !== null);

  if (specs.length === 0) return null;

  return (
    // 年式・走行距離・車検・修復歴は、一覧で比較させるために出している「本文」であって
    // 補助情報ではない。薄いグレーの14pxだと購買層（50〜60代中心）には読み取りづらいため、
    // 本文と同じ16px・十分な濃さで出す（03_ui_rules.md 4章）。
    <ul className="text-charcoal-700 mt-2 flex flex-wrap gap-x-3 gap-y-1 text-base">
      {specs.map((spec) => (
        <li
          key={spec}
          className="after:ml-3 after:text-neutral-300 after:content-['|'] last:after:content-none"
        >
          {spec}
        </li>
      ))}
    </ul>
  );
}
