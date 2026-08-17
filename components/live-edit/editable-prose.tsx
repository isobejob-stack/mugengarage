import { getSiteTexts } from "@/lib/live-edit/texts";
import { isLiveEditEnabled } from "@/lib/live-edit/context";
import { Markdown } from "@/components/ui/markdown";

// 画面に直接書かれた「まとまった文章」を、店主が丸ごと書き換えられるようにする部品。
//
// <SiteText> は1行の文言（見出し・ボタンのラベル）向けで、children に文字列しか置けない。
// 段落がいくつも続く導入文や解説は、それでは扱えない。
// こちらは既定の文章をMarkdownで持ち、DBに同じキーの行があればそちらを描画する。
//
// 事実関係を含む文章をこの形にしておく意味は大きい。
// クラシックJaguarの事実確認は最終的に店主（30年この車を扱ってきた人）が正であり、
// 開発者を通さずに直せる状態にしておかないと、間違いが残り続ける
// （docs/tasks/CONTENT_FACTCHECK.md の運用そのもの）。
export async function EditableProse({
  k,
  description,
  className,
  children,
}: {
  k: string;
  /** 編集パネルに出す「どこの文章か」の説明 */
  description: string;
  className?: string;
  /** 既定の文章（Markdown） */
  children: string;
}) {
  const [texts, editable] = await Promise.all([
    getSiteTexts(),
    isLiveEditEnabled(),
  ]);

  const value = texts.get(k) ?? children;

  const content = (
    <div className={className ?? "prose max-w-none"}>
      <Markdown>{value}</Markdown>
    </div>
  );

  if (!editable) return content;

  return (
    <div
      data-mg-edit=""
      data-mg-type="site_text"
      data-mg-id={k}
      data-mg-field="value"
      data-mg-label={description}
      data-mg-fallback={children}
      data-mg-description={description}
    >
      {content}
    </div>
  );
}
