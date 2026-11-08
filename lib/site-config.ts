// サイト全体で共通のナビゲーション設定。
// 相談の窓口はInstagramのDMに統一した（2026-11-08、店主の判断。lib/settings/sns.ts）。
// 要件定義時はLINE相談を最重要CTAとしていたが（01_business_requirements.md）、
// 店主がLINEを使っておらず、InstagramのDMが最も返信が早いため置き換えた。

// 顧客向けの店舗名。metadataのタイトル組み立て等で使う。
// 「M-GARAGE Platform」は開発側から見たシステム名であり、顧客向けの表記ではない。
export const SITE_NAME = "エムガレージ";

export type SiteNavItem = {
  label: string;
  href: string;
  description?: string;
  /** 下位項目。指定するとヘッダーでは展開メニューになる */
  children?: ReadonlyArray<{
    label: string;
    href: string;
    description: string;
  }>;
};

// グローバルナビゲーション。
//
// 2026-08-17、4項目に絞った。狙いは「読む前に選ばせない」こと。
//
// 以前は「ジャガーを知る」の下に図鑑・年表・ライブラリの3つがぶら下がっていた。
// どれも中身は良いのだが、訪問者から見ると入口で3択を迫られる。
// クラシックJaguarをまだ知らない人にとって、図鑑と年表とライブラリの違いは
// 開いてみるまで分からず、選べないまま離脱する構造になっていた。
// 「ジャガーを知る」は1枚の読み物にして、読み終えた人だけが年表へ進む形にする。
//
// 図鑑・ライブラリはナビゲーションから外したが、ページは残っている。
// 本文中の用語リンク・関連コンテンツ・パンくずからたどり着く「気になったときに引く」
// 位置づけに変えた（発注者の方針転換、2026-08-16）。
//
// 整備実績はブログに統合した。書く側から見て記事と整備実績を書き分ける必然性が薄く、
// 読む側から見ても入口が分かれている必要が無かったため。
export const siteNav: ReadonlyArray<SiteNavItem> = [
  { label: "在庫車両", href: "/vehicles" },
  { label: "ジャガーを知る", href: "/jaguar" },
  { label: "ブログ", href: "/blog" },
  { label: "お問い合わせ", href: "/contact" },
] as const;

// 問い合わせ窓口（InstagramのURL・電話・メール）と掲載媒体リンクはDB（site_settings）で管理し、管理画面から編集する。
// 以前はここに定数として持っていたが、仮の値のまま全ページのCTAに使われており、
// 開発者を介さないと最重要導線を直せない状態になっていた（docs/tasks/ISSUE-005）。
// 取得は lib/settings/queries.ts の getSiteSettings() を使う。

// FR-SEO-005/007: サイトマップ・robots.txt・構造化データ・canonical URL生成用のベースURL。
// 独自ドメイン（m-garage.com）は2026-08-05時点で未取得のため、当面はVercelの発行URLを既定値とする
// （docs/tasks/ISSUE-003-production-domain-and-plan-upgrade.md）。
// 本番ドメイン取得後は Vercel の環境変数 NEXT_PUBLIC_SITE_URL を設定すれば自動的に切り替わる。
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mugengarage.vercel.app";
