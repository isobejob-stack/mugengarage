import "server-only";

// 公開サイトの表示に使うデータのうち、「全ページで読まれるのに、めったに変わらない」ものを
// Next.jsのデータキャッシュに載せるためのタグ。
//
// 背景: 公開ページはすべてリクエストごとに描画される（force-dynamic / cookieの参照）。
// そのため、店舗情報や画面文言のように1日に何度も変わらない値まで、
// 表示のたびにSupabaseへ問い合わせていた。トップページ1枚を出すのに
// 店舗情報だけで4回（generateMetadata・本文・ヘッダー・フッター）読んでいる。
//
// ここではキャッシュに「賞味期限」ではなくタグを付け、
// 管理画面から書き換えたときに該当タグを失効させる方式をとる。
// こうすると、表示は速いまま「直したのに反映されない」が起きない。
export const CACHE_TAGS = {
  /** site_settings（店舗情報・LINE URL・ヒーロー写真） */
  siteSettings: "site-settings",
  /** site_texts（ライブ編集で差し替えた画面文言） */
  siteTexts: "site-texts",
} as const;
