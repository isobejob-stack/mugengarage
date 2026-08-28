import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";
import { SiteText } from "@/components/live-edit/site-text";
import { Editable } from "@/components/live-edit/editable";

// 店舗情報はDBから読むため、管理画面での編集が即座に反映されるようリクエストごとに描画する
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "店舗情報・アクセス",
  description:
    "クラシックJaguar専門店エムガレージの店舗情報とアクセスのご案内です。在庫車両の掲載媒体・公式SNSもご覧いただけます。",
  path: "/about",
});

// 取り扱い内容の4項目。既定の文言はここに置き、ライブ編集で1件ずつ差し替えられる。
const SERVICES = [
  {
    key: "sales",
    title: "販売",
    body: "クラシックJaguarの在庫車両をご紹介します。ご希望の条件に合わせたお探しのご相談も承ります。",
  },
  {
    key: "maintenance",
    title: "整備・修理",
    body: "旧車特有の症状を踏まえた整備・修理を行います。過去の作業内容は整備実績のページでご覧いただけます。",
  },
  {
    key: "purchase",
    title: "買取",
    body: "長く乗られたJaguarの買取も承ります。まずは車両の状態をお聞かせください。",
  },
  {
    key: "consultation",
    title: "ご相談",
    body: "購入前の疑問や、維持にまつわるご不安など、Jaguarに関することは何でもご相談ください。",
  },
] as const;

// SCR-PUB-018: 店舗情報・アクセス
export default async function Page() {
  const settings = await getSiteSettings();

  // FR-SEO-002: 事業者の構造化データ。
  // 未入力の項目はキー自体を出さない。空文字や誤った値を構造化データに含めると、
  // 検索エンジンに誤った事業者情報を学習させてしまうため。
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: SITE_NAME,
    description: "クラシックJaguar専門店",
    url: SITE_URL,
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.address
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "JP",
            ...(settings.postal_code
              ? { postalCode: settings.postal_code }
              : {}),
            streetAddress: settings.address,
          },
        }
      : {}),
    ...(settings.business_hours
      ? { openingHours: settings.business_hours }
      : {}),
    ...(settings.founded_year
      ? { foundingDate: String(settings.founded_year) }
      : {}),
    // sameAsに公式アカウントを列挙すると、それらが同一事業者のものであると検索エンジンに伝わる
    ...(settings.external_links.length > 0
      ? { sameAs: settings.external_links.map((link) => link.url) }
      : {}),
  };

  // 車両詳細と同じ方針で、JSON-LD内の "<" をエスケープしてscriptタグの早期終了を防ぐ
  const structuredDataJson = JSON.stringify(organizationStructuredData).replace(
    /</g,
    "\\u003c",
  );

  // 表示する値と、それが site_settings のどの項目かを一緒に持つ。
  // ライブ編集で「画面に出ている住所」を押したときに、どの項目を開けばよいかを
  // ここで決めておく（登録が無い項目は行ごと出ないので、押す対象にもならない）。
  type StoreInfoRow = { label: string; value: string; field: string };

  const storeInfoRows: StoreInfoRow[] = [
    settings.address
      ? {
          label: "所在地",
          value: `${settings.postal_code ? `〒${settings.postal_code} ` : ""}${settings.address}`,
          field: "address",
        }
      : null,
    settings.phone
      ? { label: "電話番号", value: settings.phone, field: "phone" }
      : null,
    settings.business_hours
      ? {
          label: "営業時間",
          value: settings.business_hours,
          field: "business_hours",
        }
      : null,
    settings.closed_days
      ? { label: "定休日", value: settings.closed_days, field: "closed_days" }
      : null,
    settings.founded_year
      ? {
          label: "創業",
          value: `${settings.founded_year}年`,
          field: "founded_year",
        }
      : null,
    settings.representative_name
      ? {
          label: "代表者",
          value: settings.representative_name,
          field: "representative_name",
        }
      : null,
  ].filter((row): row is StoreInfoRow => row !== null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />

      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        <SiteText k="about.title" description="店舗情報 見出し">
          店舗情報・アクセス
        </SiteText>
      </h1>
      <p className="text-foreground-muted mt-4">
        <SiteText k="about.lead" description="店舗情報 冒頭のあいさつ文">
          エムガレージは、クラシックJaguarを専門に取り扱う販売・整備工場です。
          Eタイプ、XK、Mark2をはじめとする往年のJaguarについて、販売から整備・修理・買取まで一貫して承っております。
        </SiteText>
      </p>

      {storeInfoRows.length > 0 && (
        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText k="about.store.heading" description="店舗情報 見出し（店舗情報の表）">
              店舗情報
            </SiteText>
          </h2>
          <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
            {storeInfoRows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 py-4 sm:flex-row"
              >
                <dt className="text-charcoal-900 font-medium sm:w-32 sm:shrink-0">
                  {row.label}
                </dt>
                <dd className="text-foreground-muted">
                  <Editable
                    type="site_settings"
                    id="singleton"
                    field={row.field}
                    label={row.label}
                  >
                    {row.field === "phone" ? (
                      <a
                        href={`tel:${row.value.replace(/[^0-9+]/g, "")}`}
                        className="ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
                      >
                        {row.value}
                      </a>
                    ) : (
                      row.value
                    )}
                  </Editable>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {settings.access_info && (
        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText k="about.access.heading" description="店舗情報 見出し（アクセス）">
              アクセス
            </SiteText>
          </h2>
          {/* 改行を保持して表示する（管理画面のテキストエリアで改行して入力されるため） */}
          <Editable
            type="site_settings"
            id="singleton"
            field="access_info"
            as="div"
            className="text-foreground-muted mt-4 whitespace-pre-wrap"
          >
            {settings.access_info}
          </Editable>
        </section>
      )}

      {settings.external_links.length > 0 && (
        <section className="mt-12">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            <SiteText k="about.links.heading" description="店舗情報 見出し（掲載媒体・SNS）">
              在庫車両の掲載媒体・公式SNS
            </SiteText>
          </h2>
          <p className="text-foreground-muted mt-2">
            <SiteText k="about.links.lead" description="店舗情報 掲載媒体・SNSの説明文">
              最新の入庫状況や日々の作業の様子は、各媒体でもご覧いただけます。
            </SiteText>
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {settings.external_links.map((link) => (
              <li key={link.url}>
                {/* 外部サイトのためCardのhrefではなくaタグで組み立てる（新しいタブで開くため） */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ease-premium shadow-soft hover:border-primary-200 hover:shadow-medium block rounded-2xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="space-y-2 p-6">
                    <p className="text-charcoal-900 text-lg font-bold">
                      {link.label}
                      <span className="sr-only">
                        （外部サイトを新しいタブで開きます）
                      </span>
                    </p>
                    {link.description && (
                      <p className="text-foreground-muted text-base">
                        {link.description}
                      </p>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          <SiteText k="about.contact.heading" description="店舗情報 見出し（お問い合わせ）">
            お問い合わせ
          </SiteText>
        </h2>
        <p className="text-foreground-muted mt-2">
          <SiteText k="about.contact.lead" description="店舗情報 ご来店前のお願い文">
            ご来店をご希望の場合は、在庫状況と対応可能なお時間をご案内しますので、事前にご連絡ください。
          </SiteText>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {settings.line_url && (
            <Button href={settings.line_url} variant="line" size="lg">
              <SiteText k="about.contact.line" description="店舗情報 LINEボタンの文言">
                LINEで相談する
              </SiteText>
            </Button>
          )}
          <Button href="/contact" variant="outline" size="lg">
            <SiteText k="about.contact.form" description="店舗情報 問い合わせフォームボタンの文言">
              フォームから問い合わせる
            </SiteText>
          </Button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          <SiteText k="about.services.heading" description="店舗情報 見出し（取り扱い内容）">
            取り扱い内容
          </SiteText>
        </h2>
        {/* 見出しと説明を1件ずつ直せるようにする。
            この4項目は「この店が何をしてくれる店か」の説明そのもので、
            扱う内容が変わったときに真っ先に直したくなる場所になる。 */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <Card key={service.key}>
              <CardBody>
                <CardTitle>
                  <SiteText
                    k={`about.services.${service.key}.title`}
                    description={`店舗情報 取り扱い内容「${service.title}」の見出し`}
                  >
                    {service.title}
                  </SiteText>
                </CardTitle>
                <CardMeta>
                  <SiteText
                    k={`about.services.${service.key}.body`}
                    description={`店舗情報 取り扱い内容「${service.title}」の説明`}
                  >
                    {service.body}
                  </SiteText>
                </CardMeta>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
