import type { ReactNode } from "react";
import Link from "next/link";
import { listPublicEncyclopediaEntriesForReading } from "@/lib/knowledge/queries";
import { getPublicTimelineSpan } from "@/lib/timeline/queries";
import { ReadingPassage } from "@/components/knowledge/reading-passage";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { buildPageMetadata } from "@/lib/seo/metadata";

// 図鑑の追加・並べ替え・本文修正が次回デプロイまで反映されないと、
// この読み物に出る車種を管理画面から変えられなくなる。リクエストごとに描画する。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "ジャガーを知る",
  description:
    "クラシックJaguarとはどういう車なのか。ブランドの成り立ち、代表的な車種、そのエンジンまで、エムガレージの図鑑からひと続きの読み物としてまとめました。",
  path: "/jaguar",
});

// 読み物に出す代表の件数。
//
// 全13車種を並べれば図鑑の一覧と変わらなくなり、「読む前に選ばせる」形に戻ってしまう。
// 上から読み切れる分量に抑え、深追いしたい人だけを図鑑へ送る。
// どの車種・どのエンジンが選ばれるかは display_order（管理画面の並び順）で決まるため、
// 差し替えはコード修正ではなく運用で行える。
const FEATURED_MODEL_COUNT = 3;
const FEATURED_ENGINE_COUNT = 2;

// ジャガーを知る（FR-ENC-002 / FR-TL-002 の公開コンテンツを読み物として再構成）。
// 画面IDは未採番。docs/screens/00_screen_list.md のSCR-PUB連番への追記が必要。
//
// 発注者の方針転換（2026-08-16）:
// 「ジャガーを知る」は図鑑・年表・ライブラリの3択を提示する分岐点になっていた。
// 訪問者は、まだクラシックJaguarを知らない段階で「図鑑と年表とライブラリの違い」を
// 判断させられ、選べないまま離脱していた。
// このページは開いた瞬間から本文が始まる1枚の読み物とし、
// 読み終えた人だけが年表・在庫へ進む形にする（選択肢を並べない）。
//
// 本文はすべてDB（encyclopedia_entries）の検証済みテキストの引用で構成する。
// このファイルが持つ文章は、事実主張を含まない導入文・接続文だけに限る
// （docs/tasks/CONTENT_FACTCHECK.md: 事実は店主レビューを経た本文に一本化する）。
export default async function Page() {
  const [entries, timelineSpan] = await Promise.all([
    listPublicEncyclopediaEntriesForReading(),
    getPublicTimelineSpan(),
  ]);

  const brand = entries.find((e) => e.category === "brand");
  const models = entries
    .filter((e) => e.category === "model")
    .slice(0, FEATURED_MODEL_COUNT);
  const engines = entries
    .filter((e) => e.category === "engine")
    .slice(0, FEATURED_ENGINE_COUNT);

  return (
    <main className="pb-4">
      {/* 冒頭。車両写真は1枚しか登録されていないため、写真に依存せず
          余白・書体・行間だけで「読ませる場所」だと伝える作りにする。 */}
      <section className="bg-cream-100 border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Breadcrumb items={[{ label: "ジャガーを知る" }]} />
          <p className="text-primary-700 mt-4 text-xs font-medium tracking-[0.15em] uppercase">
            Classic Jaguar
          </p>
          <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            ジャガーを知る
          </h1>
          <p className="text-charcoal-800 mt-6 text-lg leading-loose">
            クラシックジャガーは、写真だけでは分からない車です。
            どういう考えで作られ、走らせるとどうで、持つとどうなのか。
          </p>
          <p className="text-foreground-muted mt-4 text-base leading-loose">
            当店が図鑑に書いてきた文章から、はじめての方に読んでいただきたい順に並べました。
            上から順に読むだけで結構です。気になった車があれば、そこから深く入っていけます。
          </p>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4">
        {brand && (
          <ReadingPassage
            eyebrow="はじめに"
            title={`${brand.title}という会社`}
            body={brand.body}
            href={`/encyclopedia/${brand.slug}`}
            moreLabel={`${brand.title}編の続きを読む`}
            // 冒頭だけは2段落。この章でこのページの語り口を伝える
            paragraphCount={2}
          />
        )}

        {models.length > 0 && (
          <>
            <ChapterIntro eyebrow="車を見る">
              では、実際の車の話を。
            </ChapterIntro>
            {models.map((model) => (
              <ReadingPassage
                key={model.id}
                title={model.title}
                body={model.body}
                href={`/encyclopedia/${model.slug}`}
              />
            ))}
          </>
        )}

        {engines.length > 0 && (
          <>
            <ChapterIntro eyebrow="心臓">
              ジャガーの話は、いずれエンジンの話になります。
            </ChapterIntro>
            {engines.map((engine) => (
              <ReadingPassage
                key={engine.id}
                title={engine.title}
                body={engine.body}
                href={`/encyclopedia/${engine.slug}`}
              />
            ))}
          </>
        )}

        {/* 図鑑への導線は、読み物を読み終えた位置に1つだけ置く。
            一覧を先に見せると、また「選ぶ」作業に戻ってしまう。 */}
        <p className="mt-14 border-t border-neutral-200 pt-8 text-base">
          <Link
            href="/encyclopedia"
            className="text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2"
          >
            ほかの車種・エンジンも図鑑にあります
            <span aria-hidden="true">→</span>
          </Link>
        </p>

        {/* 年表への導線。発注者の指示どおり、読み終えた人にだけ、大きく1つ。 */}
        <section className="mt-12">
          <div className="bg-charcoal-900 shadow-medium rounded-2xl px-6 py-10 text-white sm:px-10 sm:py-12">
            {timelineSpan && (
              <p className="text-accent-400 font-mono text-sm tracking-[0.1em] tabular-nums">
                {timelineSpan.firstYear} — {timelineSpan.lastYear}
              </p>
            )}
            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              あとは、順番に並べてあります
            </h2>
            <p className="mt-4 text-base leading-loose text-neutral-300">
              ここまで読んで名前を覚えた車が、いつ、どういう順で出てきたのか。
              {timelineSpan
                ? `創業から現在までの${timelineSpan.count}件を、年表にまとめています。`
                : "創業から現在までを、年表にまとめています。"}
            </p>
            <div className="mt-8">
              <Button href="/timeline" variant="secondary" size="lg">
                Jaguar年表を見る
              </Button>
            </div>
          </div>
        </section>

        {/* 読み物で終わらせず実車へ送る。導線は1つに絞る。 */}
        <section className="mt-10 border-t border-neutral-200 pt-8 pb-4 text-center">
          <p className="text-charcoal-800 text-base leading-loose">
            読み物はここまでです。
            <br className="sm:hidden" />
            実際の車は、在庫のページにあります。
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/vehicles" variant="primary" size="lg">
              在庫車両を見る
            </Button>
          </div>
        </section>
      </article>
    </main>
  );
}

// 章の変わり目。次に何の話が始まるのかを1行だけで示す。
// 見出し（h2）は各章の図鑑項目タイトルが持つため、ここでは見出しを増やさない。
function ChapterIntro({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-16 border-t border-neutral-200 pt-10">
      <p className="text-primary-700 text-sm font-medium tracking-[0.08em]">
        {eyebrow}
      </p>
      <p className="text-charcoal-800 mt-2 font-serif text-xl leading-relaxed sm:text-2xl">
        {children}
      </p>
    </div>
  );
}
