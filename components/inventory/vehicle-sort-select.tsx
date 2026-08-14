"use client";

// 並び替え。
//
// 従来は絞り込みフォームの中に「並び替え」プルダウンが同居しており、
// 選んだあと「この条件で検索」を押さないと反映されなかった。
// 中古車メディアはいずれも並び替えを検索結果の直上に置き、選んだ瞬間に反映する。
// 並び替えは「条件を決める」操作ではなく「今出ている結果の見え方を変える」操作であり、
// 検索ボタンを挟むと、押し忘れて「並び替えが効かない」と受け取られる。
//
// JavaScriptが無効でも動くよう、実体は独立した GET フォームにしてある。
// onChange で送信するのはあくまで手数を減らすための上乗せで、
// 送信ボタン（画面上は読み上げ専用）からも同じ結果になる。

const SORT_OPTIONS = [
  { value: "", label: "おすすめ順" },
  { value: "new", label: "新着順" },
  { value: "price_asc", label: "価格が安い順" },
  { value: "price_desc", label: "価格が高い順" },
];

type SearchParams = Record<string, string | undefined>;

export function VehicleSortSelect({
  params,
  id = "vehicle-sort",
}: {
  params: SearchParams;
  id?: string;
}) {
  // 並び替え以外の絞り込み条件は hidden で引き継ぐ。
  // page は引き継がない（並び順が変われば何ページ目かという情報に意味が無くなるため）。
  const carriedOver = Object.entries(params).filter(
    ([key, value]) => Boolean(value) && key !== "sort" && key !== "page",
  );

  return (
    <form method="get" action="/vehicles" className="flex items-center gap-2">
      {carriedOver.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <label
        htmlFor={id}
        className="text-charcoal-900 shrink-0 text-sm font-medium"
      >
        並び替え
      </label>
      <select
        id={id}
        name="sort"
        defaultValue={params.sort ?? ""}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="input min-h-11 w-auto py-2"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className="sr-only">
        並び替えを適用
      </button>
    </form>
  );
}
