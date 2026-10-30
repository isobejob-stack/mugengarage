import type { ReactNode } from "react";
import { getSiteSettings } from "@/lib/settings/queries";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EditableProse } from "@/components/live-edit/editable-prose";
import { SiteText } from "@/components/live-edit/site-text";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildLineConsultationUrl } from "@/lib/site-config";

// 店舗のLINE URL（管理画面で変わる）を相談ボタンに使うため、リクエストごとに描画する。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "整備と部品のこと",
  description:
    "古いジャガーの部品はまだ手に入るのか、誰が直せるのか。メーカーの純正部品の供給状況と、クラシックジャガー専門店としての整備の考え方をご紹介します。",
  path: "/jaguar/keep-running",
});

// SCR-PUB-024: 整備と部品の方針（FR-ENC-007）。
//
// 戦略上の位置づけ（docs/strategy/03 熱源⑦「直し続ける宣言」）:
// マツダがNAロードスターのレストアと部品復刻を始めたことで所有の安心が底上げされたように、
// 「この車は直し続けられる」という見通しは、古い車を買う人の最大の安心材料になる。
//
// 書き方の線引き:
// 店として何を約束するか（対応車種・部品の確保ルート）は店主が決めることなので、
// 既定の本文には約束を書かない。書いてあるのは、メーカーの公開情報（出典付き）と、
// 店舗情報として確定している事実（クラシックJaguar専門店、30年以上の実績、販売・整備・修理）だけ。
// 店主がライブ編集で「当店が直し続ける車種」を書き足す前提で、本文はすべて <EditableProse> に入れる
// （docs/strategy/kit/S5_keep_them_running_list.md に下書きがある）。
export default async function Page() {
  const settings = await getSiteSettings();
  const lineConsultUrl = buildLineConsultationUrl(settings.line_url, "repair");

  return (
    <main className="pb-4">
      <section className="bg-cream-100 border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Breadcrumb
            items={[
              { label: "ジャガーを知る", href: "/jaguar" },
              { label: "整備と部品のこと" },
            ]}
          />
          <p className="text-primary-700 mt-4 text-xs font-medium tracking-[0.15em] uppercase">
            <SiteText
              k="keep_running.hero.eyebrow"
              description="整備と部品のこと 冒頭の英字"
            >
              Keep them running
            </SiteText>
          </p>
          <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            <SiteText
              k="keep_running.hero.title"
              description="整備と部品のこと 大見出し"
            >
              整備と部品のこと
            </SiteText>
          </h1>
          <div className="mt-6">
            <EditableProse
              k="keep_running.hero.lead"
              description="整備と部品のこと 冒頭のリード文"
              className="prose prose-lg max-w-none"
            >
              {`古いジャガーを手に入れるとき、多くの方が気にされるのは「部品はまだあるのか」「誰が直せるのか」の2つです。

どちらも、車を選ぶ前に知っておいていただきたいことです。分かっていることをまとめました。`}
            </EditableProse>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="部品">
          <SiteText
            k="keep_running.parts.heading"
            description="整備と部品のこと 部品の見出し"
          >
            メーカーは、いまも古いジャガーの部品を作っています
          </SiteText>
        </SectionHeading>

        <EditableProse
          k="keep_running.parts.body"
          className="prose mt-6 max-w-none"
          description="整備と部品のこと 部品の供給状況の本文"
        >
          {`ジャガーには、古い車のための部門「ジャガー・クラシック」があり、純正部品を供給しています。対象には、当店でよくお問い合わせをいただく年代の車も含まれています。

| 世代 | 主な年式 | メーカーの純正部品 |
| --- | --- | --- |
| シリーズ3 XJ6／XJ12 | 1979〜1992年 | 供給の対象 |
| XJ40 | 1986〜1994年 | 供給の対象 |
| XJS | 1975〜1996年 | 供給の対象 |
| X300（XJ6／XJ12／XJR） | 1994〜1997年 | 供給の対象 |
| X308（XJ8） | 1997〜2003年 | 供給の対象 |

シリーズ3のXJとXJSだけで、2万1,000点を超える部品番号と、当時の図面が残されています。回収した金型を使って、XJSのボンネットのように一度途絶えた部品を作り直す取り組みもあります。2025年には、生産終了から50年以上たったEタイプのボディパネルが約30点、新たに作られました。

ただし、メーカー自身も「どの車種でも100%の部品を揃えることは現実的ではない」としています。純正部品が手に入らないときにどうするかは、車と部品によって変わります。`}
        </EditableProse>

        <SectionHeading eyebrow="整備">
          <SiteText
            k="keep_running.service.heading"
            description="整備と部品のこと 整備の見出し"
          >
            直せる人がいることが、いちばんの安心です
          </SiteText>
        </SectionHeading>

        <EditableProse
          k="keep_running.service.body"
          className="prose mt-6 max-w-none"
          description="整備と部品のこと 当店の整備の本文（対応車種や方針を書き足す場所）"
        >
          {`古い車を維持するうえで、部品以上に限られているのが、それを組み付けて調子を見られる人です。

当店はクラシックジャガーの専門店として、30年以上にわたって販売・整備・修理を続けてきました。お乗りの車、気になっている車について、部品の見通しと整備の進め方を、車の状態を見たうえでお伝えします。`}
        </EditableProse>

        <section className="bg-cream-100 mt-16 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            <SiteText
              k="keep_running.cta.title"
              description="整備と部品のこと 相談への導線の見出し"
            >
              部品や整備のことを相談する
            </SiteText>
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            <SiteText
              k="keep_running.cta.body"
              description="整備と部品のこと 相談への導線の説明"
            >
              他店でお買い求めの車でも構いません。
            </SiteText>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {lineConsultUrl && (
              <Button href={lineConsultUrl} variant="line" size="md">
                <SiteText
                  k="keep_running.cta.line"
                  description="整備と部品のこと LINEボタンの文言"
                >
                  LINEで相談する
                </SiteText>
              </Button>
            )}
            <Button href="/jaguar/running-costs" variant="outline" size="md">
              <SiteText
                k="keep_running.cta.costs"
                description="整備と部品のこと 維持費ガイドへのボタン文言"
              >
                維持費ガイドを見る
              </SiteText>
            </Button>
          </div>
        </section>

        <div className="text-foreground-muted mt-10 border-t border-neutral-200 pt-6 text-sm">
          <EditableProse
            k="keep_running.sources"
            description="整備と部品のこと 情報の出典"
            className="prose prose-sm max-w-none"
          >
            {`**情報の出典**　Jaguar Classic Parts（ジャガー公式サイト）／Jaguar Enthusiasts' Club 2017年総会議事録／GoAuto（2025年4月、Eタイプのボディパネル再生産）。`}
          </EditableProse>
        </div>
      </article>
    </main>
  );
}

// 節の変わり目。/jaguar の章見出しと同じ見た目にそろえる。
function SectionHeading({
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
      <h2 className="text-charcoal-900 mt-2 font-serif text-xl leading-relaxed font-bold sm:text-2xl">
        {children}
      </h2>
    </div>
  );
}
