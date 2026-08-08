import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

// ページごとのmetadataを組み立てる共通ヘルパ。
//
// 背景: 公開18ページのうちgenerateMetadataを実装していたのは車両詳細の1ページだけで、
// 残り17ページはルートlayoutの値をそのまま継承していた。その結果、検索結果には
// 全ページ同一のタイトルが並び、内容の違いが判別できない状態になっていた
// （docs/tasks/ISSUE-005 参照）。
//
// title は文字列で返すと、ルートlayoutの title.template により
// 「ページ名｜エムガレージ」に整形される。一方 openGraph.title には
// template が適用されないため、ここで明示的に同じ形に揃える。
export function buildPageMetadata({
  title,
  description,
  path,
  images,
}: {
  /** ページ名のみを渡す（「｜エムガレージ」は付けない） */
  title: string;
  description: string;
  /** 先頭スラッシュ付きのパス。canonical URLの組み立てに使う */
  path: string;
  images?: string[];
}): Metadata {
  const canonical = `${SITE_URL}${path}`;
  const fullTitle = `${title}｜${SITE_NAME}`;

  return {
    title,
    description,
    // 同一内容が複数URLで到達可能な場合に正規URLを示す（重複コンテンツ対策）
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      images,
    },
  };
}

// 記事・図鑑・ライブラリ等の本文（Markdown）から、meta descriptionに使う抜粋を作る。
//
// 各詳細ページに固有のdescriptionが無いと、検索結果でどのページも同じ説明文になり、
// 内容の違いが伝わらない。本文の冒頭は多くの場合その項目の定義・要旨であるため、
// 記法を落としたうえで先頭を切り出せば、人手をかけずに固有かつ意味のある説明文になる。
export function excerptFromMarkdown(
  markdown: string | null | undefined,
  maxLength = 110,
): string {
  if (!markdown) return "";

  const plain = markdown
    // コードブロック・画像は説明文に不要なので落とす
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    // リンクは表示テキストだけ残す
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // 見出し記号・箇条書き記号（行頭のみ。S-TYPE等の語中のハイフンは壊さない）
    .replace(/^\s{0,3}#{1,6}\s+/gm, " ")
    .replace(/^\s*[-+*]\s+/gm, " ")
    .replace(/^\s*>\s?/gm, " ")
    // 強調・インラインコード・表の区切り
    .replace(/[*_`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength)}…`;
}

// 管理画面のSEO設定（seo_metas）で明示的にタイトルが指定されている場合に使う。
// 運用者が入力した文言をそのまま出したいので、title.template を適用させない。
export function absoluteTitle(title: string): Metadata["title"] {
  return { absolute: title };
}
