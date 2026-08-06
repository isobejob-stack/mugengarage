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

// FR-LINE-002: 相談カテゴリ表示。02_functional_requirements.md 記載の6カテゴリ
// （購入／修理／売却／部品／Jaguar全般／カーライフ相談）を定義する。
// presetTextはLINEトーク画面に事前入力する相談内容の初期テキストとして使う。
export type LineConsultationCategory =
  | "purchase"
  | "repair"
  | "sell"
  | "parts"
  | "general"
  | "carlife";

export const LINE_CONSULTATION_CATEGORIES: ReadonlyArray<{
  id: LineConsultationCategory;
  label: string;
  presetText: string;
}> = [
  { id: "purchase", label: "購入", presetText: "車両の購入について相談したいです。" },
  { id: "repair", label: "修理", presetText: "車両の修理について相談したいです。" },
  { id: "sell", label: "売却", presetText: "車両の売却について相談したいです。" },
  { id: "parts", label: "部品", presetText: "部品について相談したいです。" },
  {
    id: "general",
    label: "Jaguar全般",
    presetText: "Jaguarについて相談したいです。",
  },
  {
    id: "carlife",
    label: "カーライフ相談",
    presetText: "カーライフについて相談したいです。",
  },
] as const;

// FR-LINE-002 / FR-LINE-003: カテゴリ別の事前入力テキスト付きLINE相談リンクを生成する。
// LINEの友だち追加・トークリンクに `?text=` クエリパラメータを付与すると、LINEアプリ起動時に
// トーク入力欄へ指定テキストが事前入力される、という挙動が一般的に知られている形式を採用している。
// ただし、これがLINE公式ドキュメントで明示された仕様かどうかは本実装時点では未確認。
// 実際の公式LINEアカウントURL（LINE_URL）確定時には、LINE Developersの公式ドキュメントに沿った
// 正しいクエリパラメータ形式か必ず再確認し、必要であれば本関数の実装を修正すること。
//
// レビュー指摘対応（必須修正3）: contextContentを渡すと、カテゴリ既定の汎用文言の代わりに
// 「【contextContent】の購入について相談したいです。」のように対象（車両名・整備実績タイトル等）を
// 含めたプリフィル文言を生成する。ボタン文言（例：「この車をLINEで相談する」）と実際にLINEへ
// 送信される内容を一致させるための引数。
export function buildLineConsultationUrl(
  category: LineConsultationCategory,
  contextContent?: string,
): string {
  const categoryConfig = LINE_CONSULTATION_CATEGORIES.find(
    (c) => c.id === category,
  );
  const presetText = contextContent
    ? `【${contextContent}】の${categoryConfig?.label ?? ""}について相談したいです。`
    : (categoryConfig?.presetText ?? "");

  const url = new URL(LINE_URL);
  url.searchParams.set("text", presetText);
  return url.toString();
}

// FR-SEO-005/007: サイトマップ・robots.txt・構造化データ・canonical URL生成用のベースURL。
// 独自ドメイン（m-garage.com）は2026-08-05時点で未取得のため、当面はVercelの発行URLを既定値とする
// （docs/tasks/ISSUE-003-production-domain-and-plan-upgrade.md）。
// 本番ドメイン取得後は Vercel の環境変数 NEXT_PUBLIC_SITE_URL を設定すれば自動的に切り替わる。
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mugengarage.vercel.app";
