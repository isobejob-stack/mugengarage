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

// FR-SEO-005/007: サイトマップ・robots.txt・構造化データ・canonical URL生成用のベースURL。
// 独自ドメイン（m-garage.com）は2026-08-05時点で未取得のため、当面はVercelの発行URLを既定値とする
// （docs/tasks/ISSUE-003-production-domain-and-plan-upgrade.md）。
// 本番ドメイン取得後は Vercel の環境変数 NEXT_PUBLIC_SITE_URL を設定すれば自動的に切り替わる。
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mugengarage.vercel.app";
