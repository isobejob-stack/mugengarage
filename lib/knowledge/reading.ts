// 図鑑本文（Markdown）から「読み物として引用する冒頭」を取り出すためのヘルパ。
//
// なぜ必要か:
// /jaguar は事実（年号・台数・出力・逸話）を新たに書き起こさず、店主レビューを経た
// 図鑑本文をそのまま引用して構成する（docs/tasks/CONTENT_FACTCHECK.md の運用）。
// 引用元と表示側で文言がずれると、事実確認の対象が二重になってしまう。
//
// lib/seo/metadata.ts の excerptFromMarkdown はmeta description用に
// 「記法を落として文字数で切る」処理であり、画面に出す本文としては文の途中で切れる。
// こちらは段落の切れ目で取り、Markdownのまま返して .prose で描画する。

export type MarkdownOpening = {
  /**
   * 本文の最初の見出し（`## 〜`）。
   * この店の図鑑本文は見出しがそのまま要旨になっている
   * （例：Eタイプ「レーシングカーの構造を、そのまま公道に出した」）ため、
   * 一覧の1行説明としても、読み物の小見出しとしても使える。
   */
  heading: string | null;
  /** 見出しに続く段落を、Markdownのまま先頭から取り出したもの */
  paragraphs: string[];
};

export function openingFromMarkdown(
  body: string | null | undefined,
  paragraphCount = 2,
): MarkdownOpening {
  if (!body) return { heading: null, paragraphs: [] };

  // 見出し行の直後に空行が無い書き方でも段落として切り出せるよう、先に空行を補う
  const blocks = body
    .replace(/^(\s{0,3}#{1,6}\s+.*)$/gm, "$1\n")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  let heading: string | null = null;
  const paragraphs: string[] = [];

  for (const block of blocks) {
    const headingMatch = block.match(/^\s{0,3}#{1,6}\s+(.+)$/);
    if (headingMatch) {
      // 2つ目の見出しは別の話題の始まり。そこから先は引用せず打ち切る
      // （話が変わったところで「続きを読む」へ送るほうが、途中で切るより読後感が良い）。
      if (heading !== null || paragraphs.length > 0) break;
      heading = headingMatch[1].trim();
      continue;
    }

    // 段落数の判定は見出しの処理より後に置く。
    // paragraphCount=0（一覧の1行説明のように見出しだけ欲しい場合）でも
    // 最初の見出しは拾えるようにするため。
    if (paragraphs.length >= paragraphCount) break;

    // 箇条書き・表・引用は抜粋に含めない。
    // 「箇条書きすぎて読みにくい」という指摘への対応であり、
    // 一覧・読み物の冒頭は地の文だけで見せる（本文全体は詳細ページで読める）。
    if (/^([-+*]\s|\d+\.\s|>|\|)/.test(block)) continue;

    paragraphs.push(block);
  }

  return { heading, paragraphs };
}
