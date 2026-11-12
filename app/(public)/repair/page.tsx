import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardMeta, CardTitle } from "@/components/ui/card";
import { SiteText } from "@/components/live-edit/site-text";
import { EditableProse } from "@/components/live-edit/editable-prose";
import { InquiryChannels } from "@/components/layout/inquiry-channels";
import { getSiteSettings } from "@/lib/settings/queries";
import { findInstagramContact } from "@/lib/settings/sns";
import { listPublicArticles } from "@/lib/content/queries";
import { MAINTENANCE_CATEGORY } from "@/lib/content/categories";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BUSINESS_AREA_SERVED } from "@/lib/seo/business";
import {
  buildServiceStructuredData,
  serializeStructuredData,
} from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site-config";

// 店舗情報と整備記録（ブログ）をDBから読むため、リクエストごとに描画する
export const dynamic = "force-dynamic";

const DESCRIPTION =
  "ジャガー・ディムラー（デイムラー）の旧車・クラシックカーの整備・修理なら、神奈川県川崎市・南足柄市の専門店エムガレージへ。XJ6・XJ-S・ダブルシックスなどの定期的な整備、オーバーヒートや電装の故障・不調の修理、レストアや部品のご相談まで。東京・横浜からもお越しいただけます。";

export const metadata = buildPageMetadata({
  title: "ジャガー・ディムラーの整備・修理｜旧車・クラシックカーの故障のご相談",
  description: DESCRIPTION,
  path: "/repair",
});

// 整備記録の記事を何件まで出すか。それ以上はブログの「整備記録」で見られる
const MAINTENANCE_ARTICLE_LIMIT = 5;

// ご相談いただける内容。見出しと説明を1件ずつ直せるようにする（店舗情報の「取り扱い内容」と同じ作り）
const SERVICES = [
  {
    key: "maintenance",
    title: "定期的な整備",
    body: "点検と、冷却系・ゴム部品・油脂類などの消耗品の交換。症状が出る前に手を入れ、長く乗れる状態を保ちます。",
  },
  {
    key: "repair",
    title: "故障・不調の修理",
    body: "水温が上がる、電装が効かない、オイルや冷却水がにじむ、異音がするなど。気になっている症状をお聞かせください。",
  },
  {
    key: "restore",
    title: "レストア・部品のご相談",
    body: "長く乗るための手の入れ方や、部品の探し方についてもご相談ください。",
  },
  {
    key: "other",
    title: "ほかでお求めになった車も",
    body: "当店でお買い上げの車はもちろん、ほかでお求めになったジャガー・ディムラーについても、まずはご相談ください。",
  },
] as const;

const LINK_CLASS =
  "text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2";

// 整備・修理（2026-11-12 新設）。
//
// 「ジャガー 修理」「ジャガー 整備」「ディムラー 修理」「クラシックカー 整備 神奈川」のように、
// 店のサービスそのものを探す検索の受け皿。以前は店舗情報の「取り扱い内容」に2行あるだけで、
// 整備・修理を探す人が着地できるページが無かった。
//
// 文章は店主が「画面を見ながら直す」で書き換えられる。費用・納期のような店の方針は書いていない。
// 確かめてほしい箇所は docs/tasks/SEO_KEYWORDS_2026-11-12.md にまとめた。
export default async function Page() {
  const [settings, articles] = await Promise.all([
    getSiteSettings(),
    listPublicArticles(),
  ]);
  const instagram = findInstagramContact(settings.external_links);

  // 整備記録の記事（ブログに統合済み。docs/decisions/adr-002）。実例があることが専門店の裏付けになる
  const maintenanceArticles = articles
    .filter((a) => a.category === MAINTENANCE_CATEGORY)
    .slice(0, MAINTENANCE_ARTICLE_LIMIT);

  const structuredDataJson = serializeStructuredData(
    buildServiceStructuredData({
      name: "ジャガー・ディムラーの整備・修理",
      serviceType: "自動車の整備・修理",
      description: DESCRIPTION,
      url: `${SITE_URL}/repair`,
      areaServed: BUSINESS_AREA_SERVED,
      brands: ["Jaguar（ジャガー）", "Daimler（ディムラー／デイムラー）"],
    }),
  );

  return (
    <main className="pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <section className="bg-cream-100 border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Breadcrumb items={[{ label: "整備・修理" }]} />
          <p className="text-primary-700 mt-4 text-xs font-medium tracking-[0.15em] uppercase">
            <SiteText
              k="repair.hero.eyebrow"
              description="整備・修理 冒頭の英字"
            >
              Service &amp; Repair
            </SiteText>
          </p>
          <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance [word-break:auto-phrase] sm:text-5xl">
            <SiteText k="repair.hero.title" description="整備・修理 大見出し">
              ジャガー・ディムラーの整備・修理
            </SiteText>
          </h1>
          <div className="mt-6">
            <EditableProse
              k="repair.hero.lead"
              description="整備・修理 冒頭のリード文"
              className="prose prose-lg max-w-none"
            >
              {`XJ6・XJ-S・ダブルシックスをはじめ、ジャガー・ディムラーの旧車・クラシックカーを30年以上扱ってきた専門店として、整備・修理・故障のご相談を承ります。

旧車の不調は、年数で傷んだ部品から起きることが多くあります。この車のどこが傷みやすいかを知っていることが、早く正しく直すための近道です。`}
            </EditableProse>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4">
        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText
              k="repair.services.heading"
              description="整備・修理 見出し（ご相談いただける内容）"
            >
              ご相談いただける内容
            </SiteText>
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <Card key={service.key}>
                <CardBody>
                  <CardTitle>
                    <SiteText
                      k={`repair.services.${service.key}.title`}
                      description={`整備・修理「${service.title}」の見出し`}
                    >
                      {service.title}
                    </SiteText>
                  </CardTitle>
                  <CardMeta>
                    <SiteText
                      k={`repair.services.${service.key}.body`}
                      description={`整備・修理「${service.title}」の説明`}
                    >
                      {service.body}
                    </SiteText>
                  </CardMeta>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText
              k="repair.models.heading"
              description="整備・修理 見出し（対応している車種）"
            >
              対応している車種
            </SiteText>
          </h2>
          <EditableProse
            k="repair.models.body"
            description="整備・修理「対応している車種」の本文"
            className="prose mt-4 max-w-none"
          >
            {`ジャガーとディムラー（デイムラー）が専門です。当店が販売している年代の車を中心に承ります。

- XJ（XJ6・XJ12／シリーズ3・XJ40・X300・X308・X350）
- XJ-S
- ディムラー ダブルシックス・ソブリン
- XK8・XKR、Sタイプ、Xタイプ

上に無い年式・車種も、まずはご相談ください。`}
          </EditableProse>
        </section>

        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText
              k="repair.symptoms.heading"
              description="整備・修理 見出し（よくあるご相談の症状）"
            >
              よくあるご相談の症状
            </SiteText>
          </h2>
          <EditableProse
            k="repair.symptoms.body"
            description="整備・修理「よくあるご相談の症状」の本文"
            className="prose mt-4 max-w-none"
          >
            {`- **水温が上がる・オーバーヒート気味** ── ラジエーター・ホース・ウォーターポンプなど冷却系
- **窓・ドアロック・メーター・エアコンが効かない** ── 電装、配線の接触不良
- **オイルや冷却水のにじみ・漏れ** ── ガスケット・シール・ホース
- **足まわりの異音・乗り心地が悪くなった** ── ブッシュやマウントなどゴム部品
- **車高が下がる（エアサスペンションの車）** ── エアスプリング・コンプレッサー`}
          </EditableProse>
          <p className="mt-4">
            <Link href="/repair/troubles" className={LINK_CLASS}>
              <SiteText
                k="repair.symptoms.link"
                description="整備・修理 故障しやすいところへのリンク文言"
              >
                ジャガーの故障しやすいところ（年代・エンジン別）
              </SiteText>
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </section>

        {maintenanceArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
              <SiteText
                k="repair.records.heading"
                description="整備・修理 見出し（整備記録）"
              >
                整備記録
              </SiteText>
            </h2>
            <p className="text-foreground-muted mt-2">
              <SiteText
                k="repair.records.lead"
                description="整備・修理 整備記録の説明文"
              >
                実際に手を入れた車の記録です。
              </SiteText>
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {maintenanceArticles.map((article) => (
                <li key={article.id}>
                  <Card href={`/blog/${article.slug}`}>
                    <CardBody>
                      <CardTitle>{article.title}</CardTitle>
                      {article.published_at && (
                        <CardMeta>
                          {new Date(article.published_at).toLocaleDateString(
                            "ja-JP",
                          )}
                        </CardMeta>
                      )}
                    </CardBody>
                  </Card>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              <Link
                href={`/blog?category=${encodeURIComponent(MAINTENANCE_CATEGORY)}`}
                className={LINK_CLASS}
              >
                整備記録をすべて見る
                <span aria-hidden="true">→</span>
              </Link>
            </p>
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText
              k="repair.flow.heading"
              description="整備・修理 見出し（ご依頼の流れ）"
            >
              ご依頼の流れ
            </SiteText>
          </h2>
          <EditableProse
            k="repair.flow.body"
            description="整備・修理「ご依頼の流れ」の本文"
            className="prose mt-4 max-w-none"
          >
            {`1. **ご相談** ── InstagramのDM・お電話・メール・フォームで、車種・年式と、気になっている症状をお知らせください。
2. **状態の確認** ── 実車を拝見して、原因と直し方を確かめます。
3. **ご説明** ── 作業の内容と、費用の目安をご説明します。
4. **作業** ── ご納得いただいてから作業に入ります。`}
          </EditableProse>
        </section>

        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText
              k="repair.area.heading"
              description="整備・修理 見出し（拠点・対応エリア）"
            >
              拠点・対応エリア
            </SiteText>
          </h2>
          <EditableProse
            k="repair.area.body"
            description="整備・修理「拠点・対応エリア」の本文"
            className="prose mt-4 max-w-none"
          >
            {`拠点は神奈川県の川崎市と南足柄市の2か所です。川崎市は多摩川をはさんで東京都と接し、横浜市とも隣り合っているため、東京都内・横浜市からもお越しいただけます。ご来店の前にご連絡ください。`}
          </EditableProse>
          {settings.address && (
            <p className="text-charcoal-800 mt-3 text-base">
              所在地: {settings.postal_code && `〒${settings.postal_code} `}
              {settings.address}
            </p>
          )}
          <p className="mt-2 flex flex-wrap gap-x-5">
            <Link href="/about" className={LINK_CLASS}>
              店舗情報・アクセス
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/faq" className={LINK_CLASS}>
              よくある質問
              <span aria-hidden="true">→</span>
            </Link>
          </p>
        </section>

        <section className="bg-cream-100 mt-12 rounded-2xl border border-neutral-200 px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight text-balance sm:text-2xl">
            <SiteText
              k="repair.contact.heading"
              description="整備・修理 相談の見出し"
            >
              まずは症状をお聞かせください
            </SiteText>
          </h2>
          <p className="text-foreground-muted mt-2">
            <SiteText
              k="repair.contact.lead"
              description="整備・修理 相談の説明文"
            >
              車種・年式と、いつ・どんなときに気になるのかを教えていただけると、お返事が早くなります。
            </SiteText>
          </p>
          <InquiryChannels
            instagram={instagram}
            phone={settings.phone}
            email={settings.email}
            size="lg"
            mailSubject="整備・修理のご相談（エムガレージ）"
            className="mt-6"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button href="/contact" variant="outline" size="lg">
              フォームから相談する
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
