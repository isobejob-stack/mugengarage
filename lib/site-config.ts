// サイト全体で共通のナビゲーション・LINE導線設定（01_business_requirements.md: LINE相談は最重要CTA）

export const siteNav = [
  { label: "在庫車両", href: "/vehicles" },
  { label: "図鑑", href: "/encyclopedia" },
  { label: "年表", href: "/timeline" },
  { label: "ライブラリ", href: "/library" },
  { label: "ブログ", href: "/blog" },
  { label: "整備実績", href: "/maintenance-records" },
  { label: "お問い合わせ", href: "/contact" },
] as const;

// TODO: 実際の公式LINEアカウントのURLに差し替える（FR-LINE-003）
export const LINE_URL = "https://line.me/";
