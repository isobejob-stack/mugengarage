import type { ReactNode } from "react";

// 車両検索の絞り込み条件で使う共通部品。
//
// 従来の課題:
// - 「価格（下限・円）」「年式（上限）」「走行距離（上限・km）」のように、
//   単位の付け方や下限/上限の書き方が項目ごとにバラバラだった（表記揺れ）
// - 「車検残（この年月以降）」のような長いラベルが2行に折り返して読みにくかった
// - 価格を「円」の数値入力で求めていたため、590000 のように0を数えて入力する必要があった。
//   カーセンサー・グーネット等の中古車メディアは「万円」のプルダウンが定石で、
//   スマートフォンでは数値入力よりプルダウンの方が圧倒的に速い
//
// 対応として、範囲指定は「◯◯」というラベル1つに対し「下限 〜 上限」を横に並べる形へ統一する。
// ラベルに下限/上限を書かずに済むため短くなり、折り返しも起きにくい。

export type SelectOption = { value: string; label: string };

// 価格帯（万円）。この店の在庫が数十万〜500万円台に分布するため、
// 低価格帯は50万円刻み、高額帯は100万円刻みにして選択肢が増えすぎないようにする。
export const PRICE_OPTIONS: SelectOption[] = [
  { value: "500000", label: "50万円" },
  { value: "1000000", label: "100万円" },
  { value: "1500000", label: "150万円" },
  { value: "2000000", label: "200万円" },
  { value: "3000000", label: "300万円" },
  { value: "4000000", label: "400万円" },
  { value: "5000000", label: "500万円" },
];

// 年式。クラシックJaguarを扱うため1960年代まで遡れるようにする。
// 古い年代は10年刻み、近年は5年刻みとし、選択肢の数を抑える。
export const YEAR_OPTIONS: SelectOption[] = [
  { value: "1960", label: "1960年" },
  { value: "1970", label: "1970年" },
  { value: "1980", label: "1980年" },
  { value: "1990", label: "1990年" },
  { value: "1995", label: "1995年" },
  { value: "2000", label: "2000年" },
  { value: "2005", label: "2005年" },
  { value: "2010", label: "2010年" },
];

// 走行距離（上限）。旧車は10万km超も珍しくないため上限側を広めに取る。
export const MILEAGE_OPTIONS: SelectOption[] = [
  { value: "30000", label: "3万km" },
  { value: "50000", label: "5万km" },
  { value: "70000", label: "7万km" },
  { value: "100000", label: "10万km" },
  { value: "150000", label: "15万km" },
  { value: "200000", label: "20万km" },
];

export const DISPLACEMENT_OPTIONS: SelectOption[] = [
  { value: "2000", label: "2000cc" },
  { value: "3000", label: "3000cc" },
  { value: "4000", label: "4000cc" },
  { value: "5000", label: "5000cc" },
  { value: "6000", label: "6000cc" },
];

// 単一のプルダウン。ラベルと入力欄の対応を label 要素で明示する。
export function SelectField({
  label,
  name,
  defaultValue,
  options,
  placeholder = "指定なし",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: SelectOption[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-charcoal-900">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className="input mt-1">
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// 範囲指定。「価格帯」のようにラベルは1つだけ置き、下限と上限を「〜」で結ぶ。
//
// ラベルは <span> で見出しとして置き、個々のプルダウンには aria-label を付ける。
// label要素で2つの入力を包むことはできないため（1つのlabelは1つの入力にしか紐づかない）、
// スクリーンリーダー利用者にどちらが下限でどちらが上限かが伝わるようにする。
export function RangeSelectField({
  label,
  fromName,
  toName,
  fromValue,
  toValue,
  options,
  fromPlaceholder = "下限なし",
  toPlaceholder = "上限なし",
}: {
  label: string;
  fromName: string;
  toName: string;
  fromValue?: string;
  toValue?: string;
  options: SelectOption[];
  fromPlaceholder?: string;
  toPlaceholder?: string;
}) {
  return (
    <div className="block">
      <span className="text-sm font-medium text-charcoal-900">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <select
          name={fromName}
          defaultValue={fromValue ?? ""}
          aria-label={`${label}の下限`}
          className="input min-w-0 flex-1"
        >
          <option value="">{fromPlaceholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="shrink-0 text-foreground-muted">
          〜
        </span>
        <select
          name={toName}
          defaultValue={toValue ?? ""}
          aria-label={`${label}の上限`}
          className="input min-w-0 flex-1"
        >
          <option value="">{toPlaceholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-charcoal-900">{title}</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}
