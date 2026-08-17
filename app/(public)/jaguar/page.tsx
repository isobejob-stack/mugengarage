import type { ReactNode } from "react";
import Link from "next/link";
import { listPublicEncyclopediaEntriesForReading } from "@/lib/knowledge/queries";
import {
  getPublicTimelineSpan,
  listPublicTimelineEvents,
} from "@/lib/timeline/queries";
import { listPublicVehicles } from "@/lib/inventory/queries";
import { timelineYearOf } from "@/lib/timeline/format";
import { ReadingPassage } from "@/components/knowledge/reading-passage";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SiteText } from "@/components/live-edit/site-text";
import { EditableProse } from "@/components/live-edit/editable-prose";
import { buildPageMetadata } from "@/lib/seo/metadata";

// 図鑑の追加・並べ替え・本文修正が次回デプロイまで反映されないと、
// この読み物に出る車種を管理画面から変えられなくなる。リクエストごとに描画する。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "ジャガーを知る",
  description:
    "クラシックJaguarとはどういう車で、どんな人に選ばれてきたのか。1930年代の成り立ちから、いま手に入る1990〜2000年代のXJ・XK・Xタイプまでを、ひと続きの読み物としてまとめました。",
  path: "/jaguar",
});

// 「かたちが決まるまで」の章に出す旧いモデルの件数。
// 初期モデルを並べすぎると、いま買える年代にたどり着く前に読み疲れる。
const CLASSIC_ERA_COUNT = 2;
const ENGINE_COUNT = 2;

// 「いま手に入る年代」の範囲。
// 公開中の在庫の年式が1983〜2008年に集中しているため、そこから逆算した区切り。
const MODERN_ERA_FROM = 1990;
const MODERN_ERA_TO = 2015;
const MODERN_ERA_EVENT_COUNT = 8;

// 「いま手に入る年代」の章に出してよい図鑑項目の下限（display_order）。
//
// 図鑑の display_order は登場年の順に振ってある。XJ（1968年〜、order=100）以降を
// この章の対象とする。この線を引かないと、在庫の「Sタイプ（2004年式）」と
// 図鑑の「Sタイプ／420（1963年）」が名前で一致してしまい、
// 1960年代の車の解説が「いま手に入る年代」の章に出る。
// それはまさに、この改修で解消しようとしている年代の食い違いそのものになる。
const MODERN_ERA_MIN_DISPLAY_ORDER = 100;

// ジャガーを知る（FR-ENC-002 / FR-TL-002 の公開コンテンツを読み物として再構成）。SCR-PUB-020。
//
// 2026-08-17、発注者の指摘で構成を組み替えた。
// 「在庫数の多い年代ではない初期の情報に偏っている」——実際その通りで、
// 公開中の在庫15台は1983〜2008年式（うちXJが11台）なのに、
// このページは display_order 順に上から3件、つまり1930〜50年代のモデルを出していた。
// 読んで興味を持った人が在庫を見に行くと、そこに並んでいるのは別の年代の車、という状態だった。
//
// 構成:
//   1. どういう車で、どんな人に選ばれてきたのか（車種の話に入る前に置く）
//   2. かたちが決まるまで（1930〜80年代）— まとめて短く
//   3. いま手に入る年代（1990〜2010年代）— 主役。在庫と一致する
//   4. エンジン — 設計思想と、長く乗るための安心につながる部分
//   5. 年表・在庫へ送る
//
// 事実の扱い:
// 車種・エンジンの解説は従来どおりDB（encyclopedia_entries）の検証済み本文の引用。
// このファイルが持つ導入・解説文は <EditableProse> で包み、**店主が管理画面から直接直せる**
// ようにしてある。クラシックJaguarの事実確認は最終的に30年扱ってきた店主が正であり、
// 開発者を介さないと直せない場所に文章を置かないための措置
// （docs/tasks/CONTENT_FACTCHECK.md の運用に合わせる）。
export default async function Page() {
  const [entries, timelineSpan, timelineEvents, vehicles] = await Promise.all([
    listPublicEncyclopediaEntriesForReading(),
    getPublicTimelineSpan(),
    listPublicTimelineEvents(),
    listPublicVehicles(),
  ]);

  const brand = entries.find((e) => e.category === "brand");
  const models = entries.filter((e) => e.category === "model");
  const engines = entries.filter((e) => e.category === "engine");

  // 旧い年代の代表。display_order の小さい順＝古い順に並んでいる。
  const classicEra = models.slice(0, CLASSIC_ERA_COUNT);

  // いま手に入る年代の出来事。裏取り済みの年表から引く（新しい事実を書き足さないため）。
  const shownEvents = timelineEvents
    .filter((event) => {
      const year = timelineYearOf(event.event_date);
      return year !== null && year >= MODERN_ERA_FROM && year <= MODERN_ERA_TO;
    })
    .slice(0, MODERN_ERA_EVENT_COUNT);

  // いま在庫がある車種の図鑑項目を、この章で読ませる。
  // 在庫の車名で図鑑を引き当てる（図鑑側は在庫に依存しない設計のまま保つ）。
  const stockModelNames = Array.from(
    new Set(
      vehicles.map((v) => v.models?.name).filter((n): n is string => Boolean(n)),
    ),
  );
  const modernModels = models.filter(
    (entry) =>
      entry.display_order >= MODERN_ERA_MIN_DISPLAY_ORDER &&
      stockModelNames.some(
        (name) => entry.title.includes(name) || name.includes(entry.title),
      ),
  );

  // 在庫の年式の幅。「読んだ年代の車が実際にある」ことを数字で示すために使う。
  const stockYears = vehicles
    .map((v) => v.model_year)
    .filter((y): y is number => typeof y === "number");
  const stockFrom = stockYears.length > 0 ? Math.min(...stockYears) : null;
  const stockTo = stockYears.length > 0 ? Math.max(...stockYears) : null;

  return (
    <main className="pb-4">
      <section className="bg-cream-100 border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Breadcrumb items={[{ label: "ジャガーを知る" }]} />
          <p className="text-primary-700 mt-4 text-xs font-medium tracking-[0.15em] uppercase">
            <SiteText
              k="jaguar.hero.eyebrow"
              description="ジャガーを知る 冒頭の英字"
            >
              Classic Jaguar
            </SiteText>
          </p>
          <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            <SiteText
              k="jaguar.hero.title"
              description="ジャガーを知る 大見出し"
            >
              ジャガーを知る
            </SiteText>
          </h1>
          <div className="mt-6">
            <EditableProse
              k="jaguar.hero.lead"
              description="ジャガーを知る 冒頭のリード文"
              className="prose prose-lg max-w-none"
            >
              {`クラシックジャガーは、写真だけでは分からない車です。どういう考えで作られ、走らせるとどうで、持つとどうなのか。

当店が図鑑に書いてきた文章から、はじめての方に読んでいただきたい順に並べました。上から順に読むだけで結構です。気になった車があれば、そこから深く入っていけます。`}
            </EditableProse>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4">
        {/* 1. 車種の話に入る前に「どういう車で、誰が選んできたか」を置く。
            車名を知らない人にとって、いきなり車種解説が始まっても読む理由が無い。 */}
        <ChapterIntro eyebrow="はじめに">
          <SiteText
            k="jaguar.chapter.character.intro"
            description="ジャガーを知る 1章の導入（1行）"
          >
            速い車なら他にもありました。それでも選ばれてきた理由の話から。
          </SiteText>
        </ChapterIntro>

        <EditableProse
          k="jaguar.chapter.character.body"
          description="ジャガーを知る 1章「英国車としての上質さ・誰に選ばれてきたか」の本文"
        >
          {`## 速さより、乗っている時間の質

ジャガーという車を一言で言うなら、**速さを、荒々しさなしで実現しようとした車**です。

同じ時代の高性能車が、硬い足まわりと大きな音で速さを主張したのに対して、ジャガーはしなやかに動く足と、静かに回るエンジン、そして木と革でつくられた室内で同じ速さに到達しようとしました。踏めば速い。けれど、速く走っていることを乗っている人に感じさせない。これがこのブランドの一貫した考え方です。

## ウッドとレザーは飾りではない

ダッシュボードに張られたウォールナットの突板、革のシート、細いリムのステアリング。これらは高級に見せるための装飾ではなく、**長い時間そこに座っている人のための素材**として選ばれています。

革は使い込むほど体になじみ、木は経年で色が深くなる。新車のときが最も美しい素材ではなく、**時間が経つほど良くなる素材**で室内をつくる——この考え方が、40年、50年と乗り継がれる車になった理由のひとつです。

## どういう方が選んでこられたか

当店にご相談いただく方には、いくつか共通する点があります。

**他人に見せるためではなく、自分が乗るために選ぶ方。** ジャガーは、駐車場で目立つことより、ドアを閉めた瞬間の静けさや、木目に手が触れる感触を大切にする車です。

**多少の手間を「付き合い」と考えられる方。** 旧い車ですから、現代の車のように放っておいて動き続けはしません。定期的に手を入れ、様子を見ながら乗る。その時間を面倒と思わない方に向いています。

**一度好きになると長い方。** 買い替えの周期が短い車ではありません。10年、20年と同じ個体に乗り続けている方が実際に多くいらっしゃいます。

逆に、毎日確実に動くことだけを求められる方には、正直に申し上げて向きません。そこは最初にお伝えするようにしています。`}
        </EditableProse>

        {/* 2. 旧い年代はまとめて短く。ここを厚くすると、在庫のある年代に届く前に読み疲れる。 */}
        <ChapterIntro eyebrow="かたちが決まるまで（1930〜1980年代）">
          <SiteText
            k="jaguar.chapter.classic.intro"
            description="ジャガーを知る 2章の導入（1行）"
          >
            いま見て「ジャガーらしい」と感じる部分は、この時代に決まりました。
          </SiteText>
        </ChapterIntro>

        <EditableProse
          k="jaguar.chapter.classic.body"
          description="ジャガーを知る 2章「1930〜1980年代」の本文"
        >
          {`サイドカーの車体をつくる工房から始まり、戦後に自社製の6気筒エンジンを手に入れたことで、ジャガーは世界の舞台へ出ます。ル・マンでの勝利、そして1961年のEタイプ。

この時代に決まったのは、**同じ性能を、もっと安く、もっと美しく**という立ち位置でした。同時代のイタリア製GTより手の届く価格で同等の速さを出す——それがこのブランドの売り方であり、いまも中古車として選ばれる理由につながっています。

代表的なものを、図鑑から抜粋してご紹介します。`}
        </EditableProse>

        {brand && (
          <ReadingPassage
            title={`${brand.title}という会社`}
            body={brand.body}
            href={`/encyclopedia/${brand.slug}`}
            moreLabel={`${brand.title}編の続きを読む`}
            paragraphCount={2}
          />
        )}

        {classicEra.map((model) => (
          <ReadingPassage
            key={model.id}
            title={model.title}
            body={model.body}
            href={`/encyclopedia/${model.slug}`}
          />
        ))}

        {/* 3. ここが主役。在庫の年式（1983〜2008年）と一致する年代。 */}
        <ChapterIntro
          eyebrow={`いま手に入る年代（${MODERN_ERA_FROM}〜${MODERN_ERA_TO}年）`}
        >
          <SiteText
            k="jaguar.chapter.modern.intro"
            description="ジャガーを知る 3章の導入（1行）"
          >
            当店の在庫が、いちばん多いのはこの年代です。
          </SiteText>
        </ChapterIntro>

        <EditableProse
          k="jaguar.chapter.modern.body"
          description="ジャガーを知る 3章「1990〜2010年代のXJ・XK・Xタイプ」の本文"
        >
          {`## クラシックの佇まいと、現代の使いやすさが重なる年代

1990年代から2000年代のジャガーは、**旧い車の見た目と雰囲気を保ったまま、日常で使える信頼性を手に入れた**時期にあたります。

内装は変わらずウッドとレザー。低く構えた四灯のフロントマスクもそのまま。一方で、エアコンは効き、パワーステアリングは軽く、オートマチックは滑らかに変速します。1960年代の個体で必要になる「機械と対話する時間」の多くが、この年代では要らなくなっています。

**旧車に憧れはあるが、最初から手のかかる個体は不安**——という方に、当店が最初にご提案することが多いのがこの年代です。

## XJ ── ジャガーの本流

セダンのXJは、1968年の初代から一貫してこのブランドの中心にある車です。当店の在庫でも最も台数が多く、年式の幅も広くご用意しています。

見どころは**乗り心地**です。硬さで曲げるのではなく、しなやかに沈み込みながら向きを変えていく。この感覚は、同じ年代のドイツ車とはっきり違います。長距離を走ったあとの疲れ方が違う、と言われる方が多い部分です。

## XK ── 2ドアのグランドツアラー

XKは、Eタイプの流れをくむ2ドアのクーペ／コンバーチブルです。限界を攻めるスポーツカーというより、**長い距離を、速く、優雅に移動するための車**として作られています。

## Xタイプ ── 一番現実的な入口

Xタイプは、ジャガーとしては小柄な4ドアセダンです。ジャガーらしい内装をそのままに、日常で扱いやすい大きさと維持のしやすさを両立しています。**初めてのジャガー**として選ばれることが多い1台です。

---

この年代の出来事を、年表から抜粋します。`}
        </EditableProse>

        {shownEvents.length > 0 && (
          <ul className="border-primary-200 mt-8 flex flex-col gap-4 border-l-2 pl-5">
            {shownEvents.map((event) => (
              <li key={event.id}>
                <p className="text-primary-700 font-mono text-sm tabular-nums">
                  {timelineYearOf(event.event_date)}
                </p>
                <p className="text-charcoal-900 mt-0.5 text-base font-medium">
                  {event.title}
                </p>
              </li>
            ))}
          </ul>
        )}

        {modernModels.map((model) => (
          <ReadingPassage
            key={model.id}
            title={model.title}
            body={model.body}
            href={`/encyclopedia/${model.slug}`}
          />
        ))}

        {/* 4. エンジン。「安心して長く乗れるか」に直結する話としてまとめる。 */}
        <ChapterIntro eyebrow="心臓">
          <SiteText
            k="jaguar.chapter.engine.intro"
            description="ジャガーを知る 4章の導入（1行）"
          >
            ジャガーの話は、いずれエンジンの話になります。
          </SiteText>
        </ChapterIntro>

        <EditableProse
          k="jaguar.chapter.engine.body"
          description="ジャガーを知る 4章「エンジンの設計思想と堅牢さ」の本文"
        >
          {`## 鋳鉄のブロックという安心

この時代のジャガーのエンジンで、まず知っておいていただきたいのは**シリンダーブロックが鋳鉄でできている**ことです。

鋳鉄は重い素材です。軽さを競う現代の設計では敬遠されます。しかし**熱で歪みにくく、摩耗に強く、そして何より修理が効く**という長所があります。何十万kmと走った個体でも腰下が生きていることが珍しくないのは、この素材によるところが大きいと考えています。

旧い車を「これから何年乗れるか」で見るとき、この差は効いてきます。

## 高回転まで回すための頭

もう一つの特徴は、**燃焼室と吸排気の作り込み**です。半球型に近い燃焼室と、素直な吸排気の流れ。この構成は高回転まできれいに回すのに向いており、ジャガーのエンジンが「回して気持ちがいい」と言われる理由になっています。

つまり、**下は頑丈に、上は高性能に**。この組み合わせが、レースで勝ちながら乗用車として何十年も使われ続けた土台になっています。

## 実際に乗るうえで

**暖機はしてください。** 冷えた状態で回さない。これだけで寿命が変わります。

**止めっぱなしが一番良くありません。** 月に一度は走らせてください。

**冷却系は先手で。** 水回りは消耗品と考え、症状が出る前に替える。ここを守っていれば、丈夫さが効いてきます。

具体的な整備の間隔や、個体ごとの状態については、実車を見ながらご説明します。`}
        </EditableProse>

        {engines.slice(0, ENGINE_COUNT).map((engine) => (
          <ReadingPassage
            key={engine.id}
            title={engine.title}
            body={engine.body}
            href={`/encyclopedia/${engine.slug}`}
          />
        ))}

        <p className="mt-14 border-t border-neutral-200 pt-8 text-base">
          <Link
            href="/encyclopedia"
            className="text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2"
          >
            <SiteText
              k="jaguar.link.encyclopedia"
              description="ジャガーを知る 図鑑へのリンク文言"
            >
              ほかの車種・エンジンも図鑑にあります
            </SiteText>
            <span aria-hidden="true">→</span>
          </Link>
        </p>

        <section className="mt-12">
          <div className="bg-charcoal-900 shadow-medium rounded-2xl px-6 py-10 text-white sm:px-10 sm:py-12">
            {timelineSpan && (
              <p className="text-accent-400 font-mono text-sm tracking-[0.1em] tabular-nums">
                {timelineSpan.firstYear} — {timelineSpan.lastYear}
              </p>
            )}
            <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              <SiteText
                k="jaguar.timeline.heading"
                description="ジャガーを知る 年表への案内の見出し"
              >
                あとは、順番に並べてあります
              </SiteText>
            </h2>
            <p className="mt-4 text-base leading-loose text-neutral-300">
              ここまで読んで名前を覚えた車が、いつ、どういう順で出てきたのか。
              {timelineSpan
                ? `創業から現在までの${timelineSpan.count}件を、年表にまとめています。`
                : "創業から現在までを、年表にまとめています。"}
            </p>
            <div className="mt-8">
              <Button href="/timeline" variant="secondary" size="lg">
                <SiteText
                  k="jaguar.timeline.cta"
                  description="ジャガーを知る 年表ボタンの文言"
                >
                  Jaguar年表を見る
                </SiteText>
              </Button>
            </div>
          </div>
        </section>

        {/* 読み物で終わらせず実車へ送る。読んだ年代の車が実際にあることを数字で示す。 */}
        <section className="mt-10 border-t border-neutral-200 pt-8 text-center">
          <p className="text-charcoal-800 text-base leading-loose">
            <SiteText
              k="jaguar.stock.lead"
              description="ジャガーを知る 在庫へ送る文言"
            >
              読み物はここまでです。実際の車は、在庫のページにあります。
            </SiteText>
          </p>
          {stockFrom !== null && stockTo !== null && (
            <p className="text-foreground-muted mt-2 text-base">
              いまご覧いただけるのは{stockFrom}年〜{stockTo}年式の{vehicles.length}
              台です。
            </p>
          )}
          <div className="mt-6 flex justify-center">
            <Button href="/vehicles" variant="primary" size="lg">
              <SiteText
                k="jaguar.stock.cta"
                description="ジャガーを知る 在庫ボタンの文言"
              >
                在庫車両を見る
              </SiteText>
            </Button>
          </div>
        </section>
      </article>
    </main>
  );
}

// 章の変わり目。次に何の話が始まるのかを1行だけで示す。
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
