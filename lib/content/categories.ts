// ブログのカテゴリ定義（発注者要望 2026-08-17: 整備実績をブログへ統合し、読み物を5つに分類する）
//
// 【なぜ tags / taggings ではなく articles.category を使うのか】
// tags・taggings のテーブルは存在するが本番で0件＝未使用であり、
// 記事の分類は「1記事につき1つ」で足りる（新着入庫でもあり技術解説でもある記事は作らない運用）。
// 単一選択なら join も中間テーブルも要らず、管理画面の入力欄も1つで済む。
// 複数分類が必要になった時点で taggings へ移せるよう、値はDBの文字列のまま持つ。
//
// 【なぜ値が日本語なのか】
// 既存の articles.category に日本語（「購入ガイド」「技術解説」等）が入っており、
// 英字スラッグへ寄せると全記事の値の書き換えと、URLクエリの読み替えが同時に必要になる。
// 値をそのまま日本語にすれば、移行は「表記を揃えるUPDATE」だけで済む。
// URLに載せる際は encodeURIComponent で包む（?category=%E6%95%B4%E5%82%99%E8%A8%98%E9%8C%B2）。

export type ContentCategory = {
  /** DBの articles.category に入る値。URLクエリにもこの値を使う */
  value: string;
  /** 画面に出す表示名。値と分けて持つことで、DBを触らずに言い回しだけ変えられる */
  label: string;
};

export const CONTENT_CATEGORIES: readonly ContentCategory[] = [
  { value: "新着入庫", label: "新着入庫（車紹介）" },
  { value: "購入ガイド", label: "購入ガイド" },
  { value: "整備記録", label: "整備記録（維持・メンテナンス）" },
  { value: "技術解説", label: "技術解説" },
  { value: "トリビア・豆知識", label: "トリビア・豆知識" },
] as const;

/** 整備実績から移ってきた記事に付けるカテゴリ。移行SQLと画面で同じ値を使うための定数 */
export const MAINTENANCE_CATEGORY = "整備記録";

export function isKnownContentCategory(value: string | null | undefined) {
  return CONTENT_CATEGORIES.some((c) => c.value === value);
}

/**
 * カテゴリ値を表示名に直す。
 *
 * 未知の値（移行SQLを流す前の「モデル紹介」「歴史」など）は、そのまま返す。
 * ここで空文字や「その他」に潰すと、DBの中身と画面の表示がずれて
 * 「管理画面で設定したはずのカテゴリが消えた」と見える。SQL適用前でも壊れないことを優先する。
 */
export function contentCategoryLabel(value: string | null | undefined) {
  if (!value) return null;
  return CONTENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/**
 * プルダウンに出す選択肢。
 *
 * 現在の値が5カテゴリに無いときだけ、その値を先頭に足して残す。
 * 足さないと「編集画面を開いて保存しただけで、既存のカテゴリが別のものに書き換わる」ため
 * （selectは先頭の選択肢を勝手に選ぶ）。移行SQLを流せばこの一時的な選択肢は自然に消える。
 */
export function contentCategoryOptions(
  currentValue: string | null | undefined,
): ContentCategory[] {
  if (currentValue && !isKnownContentCategory(currentValue)) {
    return [
      { value: currentValue, label: `${currentValue}（現在の値）` },
      ...CONTENT_CATEGORIES,
    ];
  }
  return [...CONTENT_CATEGORIES];
}
