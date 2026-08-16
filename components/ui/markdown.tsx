import "server-only";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PluggableList } from "unified";
import {
  listGlossaryTerms,
  remarkGlossaryLinks,
  type LinkTermsOptions,
} from "@/lib/library/glossary";

// Markdown本文の共通描画。
//
// これまで図鑑・ライブラリ・ブログ・車両紹介・オーナーズアーカイブの各ページが
// それぞれ <ReactMarkdown remarkPlugins={[remarkGfm]}> を直接呼んでおり、
// 本文の描画方法を1箇所変えたいだけで5ファイルを触る必要があった。
// FR-LIB-002 の用語自動リンクのような「本文全体に効く仕掛け」を足すには、
// 先に描画の入口を1つにまとめる必要がある。
//
// 出力は従来と同じ ReactMarkdown の結果そのもの（ラッパー要素を足さない）。
// 呼び出し側の <div className="prose"> の中でそのまま差し替えられるようにするため。
//
// 非同期のサーバーコンポーネント（用語一覧をDBから引く）なので、
// クライアントコンポーネントからは描画できない。

interface MarkdownProps {
  /** 描画するMarkdown本文 */
  children: string;
  /**
   * 本文中の用語をライブラリ・図鑑へ自動リンクする。
   * 読み物（図鑑・ライブラリ・ブログ）向け。整備記録のように用語解説が
   * 邪魔になる本文では既定のまま false にしておく。
   */
  linkTerms?: boolean;
  /**
   * 自動リンクの対象から外すslug。自分自身のページのslugを渡す。
   * ライブラリ「SUキャブレター」の本文中の「SUキャブレター」が
   * 自分自身へリンクしても読者には何の情報も増えない。
   */
  excludeSlugs?: readonly string[];
  /** 1本文あたりのリンク上限を既定値から変えたいときだけ指定する */
  maxTermLinks?: number;
}

export async function Markdown({
  children,
  linkTerms = false,
  excludeSlugs,
  maxTermLinks,
}: MarkdownProps) {
  const remarkPlugins: PluggableList = [remarkGfm];

  if (linkTerms) {
    const terms = await listGlossaryTerms();
    const options: LinkTermsOptions = {
      terms,
      excludeSlugs,
      maxLinks: maxTermLinks,
    };
    remarkPlugins.push([remarkGlossaryLinks, options]);
  }

  return <ReactMarkdown remarkPlugins={remarkPlugins}>{children}</ReactMarkdown>;
}
