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
  title: "クラシックジャガーの維持費",
  description:
    "古いジャガーは、毎年いくらかかるのか。自動車税・重量税・自賠責保険の法定費用を、13年超・18年超の重課を含めて車種別に計算しました。整備費の考え方と、壊れる前に替えるという付き合い方もご紹介します。",
  path: "/jaguar/running-costs",
});

// SCR-PUB-023: 維持費ガイド（FR-ENC-006）。
//
// 戦略上の位置づけ（docs/strategy/04 インサイトI-2）:
// クラシックJaguarを検討する人の不安の正体は「壊れる」ことより
// 「いくらかかるか分からない」「誰に相談すればいいか分からない」ことにある。
// 分かっている数字はすべて出し、分からない部分（個体ごとの整備費）は
// 相談につなげる、というのがこのページの役割。
//
// 数字の扱い（BR-CONTENT-005）:
// 法定費用は公的な税率表から計算した値だけを書く（docs/strategy/kit/S3_running_cost_model.md）。
// 店の実績が必要な整備費は、推測の金額を書かずに考え方だけを置き、
// 店主がライブ編集で実績の数字を足せるようにしてある。
// 税額・保険料は改定されるため、本文はすべて <EditableProse> に入れ、開発者を介さずに直せるようにする。
export default async function Page() {
  const settings = await getSiteSettings();
  const lineConsultUrl = buildLineConsultationUrl(
    settings.line_url,
    "carlife",
    "維持費",
  );

  return (
    <main className="pb-4">
      <section className="bg-cream-100 border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Breadcrumb
            items={[
              { label: "ジャガーを知る", href: "/jaguar" },
              { label: "維持費ガイド" },
            ]}
          />
          <p className="text-primary-700 mt-4 text-xs font-medium tracking-[0.15em] uppercase">
            <SiteText
              k="running_costs.hero.eyebrow"
              description="維持費ガイド 冒頭の英字"
            >
              Running costs
            </SiteText>
          </p>
          <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            <SiteText
              k="running_costs.hero.title"
              description="維持費ガイド 大見出し"
            >
              クラシックジャガーの維持費
            </SiteText>
          </h1>
          <div className="mt-6">
            <EditableProse
              k="running_costs.hero.lead"
              description="維持費ガイド 冒頭のリード文"
              className="prose prose-lg max-w-none"
            >
              {`「古いジャガーは維持費が怖い」とよく言われます。私たちは、怖さの正体は金額の大きさより、**いくらかかるか分からないこと**だと考えています。

だから、分かっている数字はすべてここに書きます。分からない部分は、個体ごとにご相談のなかでお伝えします。`}
            </EditableProse>
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4">
        <SectionHeading eyebrow="毎年、必ずかかるお金">
          <SiteText
            k="running_costs.legal.heading"
            description="維持費ガイド 法定費用の見出し"
          >
            税金と自賠責保険
          </SiteText>
        </SectionHeading>

        <EditableProse
          k="running_costs.legal.body"
          className="prose mt-6 max-w-none"
          description="維持費ガイド 法定費用（税率表と計算例）の本文"
        >
          {`古い車には、新しい車にない税金の上乗せ（重課）があります。どの店で買っても変わらない、制度で決まっているお金です。

## 自動車税（毎年5月）

2019年9月30日以前に初めて登録された自家用乗用車の税額です。初度登録から13年を超えると、およそ15%上乗せされます。クラシックジャガーはすべて13年超にあたります。

| 総排気量 | 13年超の税額 | 主な車種 |
| --- | --- | --- |
| 3.0L超〜3.5L以下 | 66,700円 | XJ40／X300 の3.2L |
| 3.5L超〜4.0L以下 | 76,400円 | XJ40 4.0、X300 XJ6 4.0、XJS 3.6・4.0、X308 4.0 |
| 4.5L超〜6.0L以下 | 101,200円 | XJS V12、X300 XJ12、シリーズ3 XJ12 |

## 自動車重量税（車検のときに2年分）

18年を超えた自家用乗用車の税額です。13年超と18年超の2段階で上乗せされます。

| 車両重量 | 2年分 | 1年あたり |
| --- | --- | --- |
| 1.5t超〜2.0t以下 | 50,400円 | 25,200円 |
| 2.0t超〜2.5t以下 | 63,000円 | 31,500円 |

XJ40、X300のXJ6、XJSの多くは1.5t超〜2.0t以下です。正確な重量は車検証でご確認ください。

## 自賠責保険（車検のときに24ヶ月分）

2026年11月1日以降に保険期間が始まる契約から、24ヶ月で18,560円（1年あたり9,280円）です。離島と沖縄県を除きます。

## 1年あたりの法定費用

| 車種 | 1年の合計 |
| --- | --- |
| X300 XJ6 3.2 | 約10.1万円 |
| X300 XJ6 4.0／XJ40 4.0 | 約11.1万円 |
| XJS 4.0 | 約11.1万円 |
| XJS V12 | 約13.6万円 |

自動車税（上の表）に、重量税の1年分（25,200円）と自賠責保険の1年分（9,280円）を足した金額です。車両重量が1.5t超〜2.0t以下の場合で計算しています。車検の検査手数料と、任意保険、燃料、駐車場代は含みません。税額と保険料は改定されることがあります（2026年10月時点で計算）。`}
        </EditableProse>

        <SectionHeading eyebrow="整備にかかるお金">
          <SiteText
            k="running_costs.maintenance.heading"
            description="維持費ガイド 整備費の見出し"
          >
            個体の状態で、大きく変わります
          </SiteText>
        </SectionHeading>

        <EditableProse
          k="running_costs.maintenance.body"
          className="prose mt-6 max-w-none"
          description="維持費ガイド 整備費の本文（店の実績の数字を書き足す場所）"
        >
          {`整備にかかる費用は、同じ車種でも、これまでどう手を入れられてきたかで大きく変わります。安く買えた個体ほど、先送りされてきた整備をまとめて抱えていることがあります。

気になる車があれば、**その個体の整備記録と、これから必要になりそうな整備について、購入前にお尋ねください**。車両価格だけでなく、乗り始めてからの1年にかかる総額でご判断いただくことをおすすめしています。`}
        </EditableProse>

        <SectionHeading eyebrow="付き合い方">
          <SiteText
            k="running_costs.preventive.heading"
            description="維持費ガイド 予防整備の見出し"
          >
            壊れる前に替える
          </SiteText>
        </SectionHeading>

        <EditableProse
          k="running_costs.preventive.body"
          className="prose mt-6 max-w-none"
          description="維持費ガイド 予防整備の本文"
        >
          {`古い車の故障の多くは、突然起きるように見えて、実はゴムや配線の経年劣化から順番に起きています。冷却系のホース、燃料ホース、電装の接点、足まわりのブッシュといった部品です。

交換の時期が読める部品を、計画的に替えていく。そうすると「ある日突然の大きな出費」は減り、維持費は**毎年の予定に組み込めるお金**に変わっていきます。

どの部品をいつ替えるかは、車種と個体によって違います。お乗りの車、気になっている車について、お気軽にご相談ください。`}
        </EditableProse>

        <section className="bg-cream-100 mt-16 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            <SiteText
              k="running_costs.cta.title"
              description="維持費ガイド 相談への導線の見出し"
            >
              気になる車の維持費を聞いてみる
            </SiteText>
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            <SiteText
              k="running_costs.cta.body"
              description="維持費ガイド 相談への導線の説明"
            >
              車種や年式が決まっていなくても構いません。
            </SiteText>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {lineConsultUrl && (
              <Button href={lineConsultUrl} variant="line" size="md">
                <SiteText
                  k="running_costs.cta.line"
                  description="維持費ガイド LINEボタンの文言"
                >
                  LINEで相談する
                </SiteText>
              </Button>
            )}
            <Button href="/vehicles" variant="outline" size="md">
              <SiteText
                k="running_costs.cta.vehicles"
                description="維持費ガイド 在庫ボタンの文言"
              >
                在庫車両を見る
              </SiteText>
            </Button>
          </div>
        </section>

        <div className="text-foreground-muted mt-10 border-t border-neutral-200 pt-6 text-sm">
          <EditableProse
            k="running_costs.sources"
            description="維持費ガイド 数字の出典"
            className="prose prose-sm max-w-none"
          >
            {`**数字の出典**　自動車税：各都道府県の税率表（13年超は標準税額の約15%増、100円未満切り捨て）／自動車重量税：国土交通省「自動車重量税額について」／自賠責保険：2026年11月1日改定の基準料率。`}
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
