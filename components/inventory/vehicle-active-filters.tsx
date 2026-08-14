import Link from "next/link";
import {
  PRICE_OPTIONS,
  YEAR_OPTIONS,
  MILEAGE_OPTIONS,
  DISPLACEMENT_OPTIONS,
  type SelectOption,
} from "@/components/inventory/vehicle-search-fields";

// 適用中の絞り込み条件を「外せるタグ」として並べる。
//
// 従来は、絞り込んだあとに何の条件が効いているかを知る手段が
// 「フォームのプルダウンを1つずつ見に行く」しかなく、外す手段も
// 「条件をクリア」（全解除）しか無かった。
// カーセンサー・グーネット等は例外なく、結果の直前に適用中の条件を並べて
// 1つずつ外せるようにしている。条件を1つだけ緩めて件数を見る、という
// 中古車探しで最も頻度の高い操作を、フォームまで戻らずに行えるようにするため。
//
// 範囲条件（価格・年式など）は下限と上限で1つのタグにまとめる。
// 「100万円〜」と「〜300万円」が別々のタグとして並ぶと、
// 価格帯を外したいだけなのに2回操作が必要になる。

export type FacetOptions = {
  models: Array<{ id: string; name: string }>;
  series: Array<{ id: string; name: string }>;
  generations: Array<{ id: string; name: string }>;
  grades: Array<{ id: string; name: string }>;
  transmissions: string[];
  exteriorColors: string[];
  drivetrains: string[];
};

export type ActiveFilter = {
  /** 表示する条件名（例: 車両本体価格） */
  label: string;
  /** 表示する値（例: 100万円〜300万円） */
  value: string;
  /** このタグを外すときに削除するクエリパラメータ */
  removeKeys: string[];
};

type SearchParams = Record<string, string | undefined>;

function labelOf(options: SelectOption[], value: string | undefined) {
  if (!value) return undefined;
  return options.find((o) => o.value === value)?.label;
}

function nameOf(
  rows: Array<{ id: string; name: string }>,
  value: string | undefined,
) {
  if (!value) return undefined;
  return rows.find((r) => r.id === value)?.name;
}

// 「下限〜上限」を1つの文言にする。片側のみの指定にも対応する。
function rangeValue(from: string | undefined, to: string | undefined) {
  if (from && to) return `${from}〜${to}`;
  if (from) return `${from}以上`;
  if (to) return `${to}以下`;
  return undefined;
}

export function buildActiveFilters(
  params: SearchParams,
  facets: FacetOptions,
): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  const push = (
    label: string,
    value: string | undefined,
    removeKeys: string[],
  ) => {
    if (value) filters.push({ label, value, removeKeys });
  };

  push("車種", nameOf(facets.models, params.model), ["model"]);
  push("シリーズ", nameOf(facets.series, params.series), ["series"]);
  push("世代", nameOf(facets.generations, params.generation), ["generation"]);
  push("グレード", nameOf(facets.grades, params.grade), ["grade"]);

  push(
    "車両本体価格",
    rangeValue(
      labelOf(PRICE_OPTIONS, params.price_min),
      labelOf(PRICE_OPTIONS, params.price_max),
    ),
    ["price_min", "price_max"],
  );
  push(
    "年式",
    rangeValue(
      labelOf(YEAR_OPTIONS, params.year_min),
      labelOf(YEAR_OPTIONS, params.year_max),
    ),
    ["year_min", "year_max"],
  );
  push(
    "走行距離",
    labelOf(MILEAGE_OPTIONS, params.mileage_max)
      ? `${labelOf(MILEAGE_OPTIONS, params.mileage_max)}以下`
      : undefined,
    ["mileage_max"],
  );
  push(
    "排気量",
    rangeValue(
      labelOf(DISPLACEMENT_OPTIONS, params.displacement_min),
      labelOf(DISPLACEMENT_OPTIONS, params.displacement_max),
    ),
    ["displacement_min", "displacement_max"],
  );

  push("ミッション", params.transmission, ["transmission"]);
  push("駆動方式", params.drivetrain, ["drivetrain"]);
  push("外装色", params.exterior_color, ["exterior_color"]);

  // ON/OFF条件は「条件名＝値」なので、値側にだけ文言を置く
  if (params.shaken === "1") {
    filters.push({ label: "", value: "車検あり", removeKeys: ["shaken"] });
  }
  if (params.no_accident === "1") {
    filters.push({
      label: "",
      value: "修復歴なし",
      removeKeys: ["no_accident"],
    });
  }

  return filters;
}

// 指定したキーを除いた検索URLを作る。
// 条件を変えたら必ず1ページ目に戻す（3ページ目を見ている状態で条件を絞ると、
// 該当件数が減って「該当なし」の空ページに着地してしまうため）。
function urlWithout(params: SearchParams, removeKeys: string[]) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (removeKeys.includes(key)) continue;
    if (key === "page") continue;
    next.set(key, value);
  }
  const qs = next.toString();
  return qs ? `/vehicles?${qs}` : "/vehicles";
}

export function VehicleActiveFilters({
  params,
  facets,
}: {
  params: SearchParams;
  facets: FacetOptions;
}) {
  const filters = buildActiveFilters(params, facets);
  if (filters.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="text-charcoal-900 text-sm font-bold">絞り込み中の条件</h2>
      <ul className="mt-2 flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <li key={`${filter.label}-${filter.value}`}>
            {/*
              タグ全体をリンクにして「タップ＝この条件を外す」にする。
              ×印だけを押させると、指の太い利用者・高齢の利用者には小さすぎるため
              （03_ui_rules.md: タップ領域44px以上）。
            */}
            <Link
              href={urlWithout(params, filter.removeKeys)}
              className="border-primary-200 bg-primary-50 text-charcoal-900 hover:border-primary-400 hover:bg-primary-100 inline-flex min-h-11 items-center gap-2 rounded-full border py-2 pr-3 pl-4 text-sm transition-colors"
            >
              <span>
                {filter.label && (
                  <span className="text-foreground-muted">
                    {filter.label}：
                  </span>
                )}
                <span className="font-medium">{filter.value}</span>
              </span>
              <span
                aria-hidden="true"
                className="bg-primary-200/70 text-primary-800 grid size-5 shrink-0 place-items-center rounded-full text-xs leading-none"
              >
                ×
              </span>
              <span className="sr-only">この条件を外す</span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/vehicles"
            className="text-foreground-muted hover:text-charcoal-900 inline-flex min-h-11 items-center px-3 text-sm underline underline-offset-4"
          >
            すべての条件をクリア
          </Link>
        </li>
      </ul>
    </div>
  );
}
