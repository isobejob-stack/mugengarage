import Link from "next/link";
import { Markdown } from "@/components/ui/markdown";
import { openingFromMarkdown } from "@/lib/knowledge/reading";

// /jaguar（1枚の読み物）の1章分。
//
// 「カードを並べて選ばせる」のをやめるための部品である。
// 図鑑本文の冒頭をそのまま読ませ、そこで興味を持った人だけが詳細へ進む。
// 事実（年号・台数・出力）は必ず本文側にあり、この部品は一切書き足さない
// （docs/tasks/CONTENT_FACTCHECK.md: 事実は店主レビュー済みの本文に一本化する）。
export function ReadingPassage({
  eyebrow,
  title,
  body,
  href,
  moreLabel,
  paragraphCount = 1,
}: {
  /** 章の位置づけを示す小さな前置き（例：「はじめに」） */
  eyebrow?: string;
  /** 章の見出し。図鑑項目のタイトルをそのまま使う */
  title: string;
  /** 図鑑本文（Markdown）。この中から冒頭だけを引用する */
  body: string;
  /** 続きを読む先（図鑑詳細） */
  href: string;
  moreLabel?: string;
  /** 引用する段落数。章の重みに応じて呼び出し側で決める */
  paragraphCount?: number;
}) {
  const { heading, paragraphs } = openingFromMarkdown(body, paragraphCount);

  return (
    <section className="mt-14">
      {eyebrow && (
        <p className="text-primary-700 text-sm font-medium tracking-[0.08em]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-charcoal-900 mt-1 font-serif text-2xl font-bold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {heading && (
        // 図鑑本文の最初の見出しは、その項目の要旨そのものになっている。
        // 章タイトル（車種名）だけでは何の話か分からないため、ここで受ける。
        <h3 className="text-charcoal-800 mt-4 font-serif text-lg font-bold tracking-tight sm:text-xl">
          {heading}
        </h3>
      )}
      {paragraphs.length > 0 && (
        <div className="prose mt-3 max-w-none">
          <Markdown>
            {paragraphs.join("\n\n")}
          </Markdown>
        </div>
      )}
      <p className="mt-5">
        {/* 読み終えた流れのまま進めるよう、ボタンではなく本文と地続きのリンクにする。
            タップ領域は44px以上を確保する（03_ui_rules.md 4章）。 */}
        <Link
          href={href}
          className="text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 text-base font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2"
        >
          {moreLabel ?? `${title}の続きを読む`}
          <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
