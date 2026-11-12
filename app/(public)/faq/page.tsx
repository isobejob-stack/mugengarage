import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SiteText } from "@/components/live-edit/site-text";
import { EditableProse } from "@/components/live-edit/editable-prose";
import { InquiryChannels } from "@/components/layout/inquiry-channels";
import { getSiteSettings } from "@/lib/settings/queries";
import { findInstagramContact } from "@/lib/settings/sns";
import { getSiteTexts } from "@/lib/live-edit/texts";
import { getPublicVehicleStockSummary } from "@/lib/inventory/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildFaqGroups,
  faqAnswerKey,
  faqQuestionKey,
  resolveFaqItems,
} from "@/lib/seo/faq";
import {
  buildFaqPageStructuredData,
  serializeStructuredData,
} from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site-config";

// 店舗情報・在庫・ライブ編集の文章をDBから読むため、リクエストごとに描画する
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "よくある質問｜ジャガー・ディムラーの購入・整備・修理・買取",
  description:
    "神奈川県川崎市・南足柄市のジャガー・ディムラー（デイムラー）専門店エムガレージへの、よくあるご質問。来店の予約、東京・横浜からのアクセス、ディムラーとジャガーの違い、旧車は壊れやすいか、他店で買った車の整備・修理、買取までお答えします。",
  path: "/faq",
});

const LINK_CLASS =
  "text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2";

// よくある質問（2026-11-12 新設）。中身は lib/seo/faq.ts。
//
// 問いの形で探す検索（「ジャガー 旧車 壊れやすい」「ディムラー ジャガー 違い」）と、
// AIの回答の出典になることを狙う。問いと答えは店主が画面を見ながら直せる。
export default async function Page() {
  const [settings, stock, texts] = await Promise.all([
    getSiteSettings(),
    getPublicVehicleStockSummary(),
    getSiteTexts(),
  ]);
  const instagram = findInstagramContact(settings.external_links);

  const groups = buildFaqGroups({ settings, stock });
  const structuredDataJson = serializeStructuredData(
    buildFaqPageStructuredData({
      url: `${SITE_URL}/faq`,
      items: resolveFaqItems(groups, texts),
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <Breadcrumb items={[{ label: "よくある質問" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        <SiteText k="faq.title" description="よくある質問 見出し">
          よくある質問
        </SiteText>
      </h1>
      <p className="text-foreground-muted mt-3 text-base leading-loose">
        <SiteText k="faq.lead" description="よくある質問 冒頭の説明文">
          ご来店・車選び・整備や修理・買取について、よくいただくご質問にお答えします。ここに無いことは、お気軽にお問い合わせください。
        </SiteText>
      </p>

      {/* 目次。質問が13件あるので、分類から飛べるようにする */}
      <nav aria-label="よくある質問の分類" className="mt-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-1">
          {groups.map((group, index) => (
            <li key={group.heading}>
              <a href={`#faq-${index + 1}`} className={LINK_CLASS}>
                {group.heading}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {groups.map((group, groupIndex) => (
        <section
          key={group.heading}
          id={`faq-${groupIndex + 1}`}
          className="mt-12 scroll-mt-8"
        >
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            {group.heading}
          </h2>
          <div className="mt-4 divide-y divide-neutral-200 border-y border-neutral-200">
            {group.items.map((item) => (
              <div key={item.key} className="py-6">
                <h3 className="text-charcoal-900 flex gap-2 text-lg font-bold">
                  <span aria-hidden="true" className="text-primary-700">
                    Q.
                  </span>
                  <span>
                    <SiteText
                      k={faqQuestionKey(item)}
                      description={`よくある質問「${item.question}」の問い`}
                    >
                      {item.question}
                    </SiteText>
                  </span>
                </h3>
                <div className="mt-3 flex gap-2">
                  <span
                    aria-hidden="true"
                    className="text-foreground-muted text-lg font-bold"
                  >
                    A.
                  </span>
                  <div className="min-w-0 flex-1">
                    <EditableProse
                      k={faqAnswerKey(item)}
                      description={`よくある質問「${item.question}」の答え`}
                      className="prose max-w-none"
                    >
                      {item.answer}
                    </EditableProse>
                    {/* 住所・営業時間などは店舗情報から差し込む（直すときは店舗情報の欄を直す） */}
                    {item.facts.length > 0 && (
                      <ul className="text-charcoal-800 mt-3 space-y-1 text-base">
                        {item.facts.map((fact) => (
                          <li key={fact}>{fact}</li>
                        ))}
                      </ul>
                    )}
                    {item.links.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-x-5">
                        {item.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={LINK_CLASS}
                          >
                            {link.label}
                            <span aria-hidden="true">→</span>
                          </Link>
                        ))}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-cream-100 mt-12 rounded-2xl border border-neutral-200 px-6 py-8 sm:px-10">
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          <SiteText
            k="faq.contact.heading"
            description="よくある質問 お問い合わせの見出し"
          >
            ほかにご不明な点は
          </SiteText>
        </h2>
        <p className="text-foreground-muted mt-2">
          <SiteText
            k="faq.contact.lead"
            description="よくある質問 お問い合わせの説明文"
          >
            購入・修理・売却・部品・その他、Jaguarのことなら何でもご相談ください。
          </SiteText>
        </p>
        <InquiryChannels
          instagram={instagram}
          phone={settings.phone}
          email={settings.email}
          size="lg"
          mailSubject="ご質問（エムガレージ）"
          className="mt-6"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href="/contact" variant="outline" size="lg">
            フォームから問い合わせる
          </Button>
        </div>
      </section>
    </main>
  );
}
