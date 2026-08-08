import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";

// 店舗情報はDBから読むため、管理画面での編集が即座に反映されるようリクエストごとに描画する
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "店舗情報・アクセス",
  description:
    "クラシックJaguar専門店エムガレージの店舗情報とアクセスのご案内です。在庫車両の掲載媒体・公式SNSもご覧いただけます。",
  path: "/about",
});

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

  const storeInfoRows: Array<[string, string]> = [
    settings.address
      ? ([
          "所在地",
          `${settings.postal_code ? `〒${settings.postal_code} ` : ""}${settings.address}`,
        ] as [string, string])
      : null,
    settings.phone ? (["電話番号", settings.phone] as [string, string]) : null,
    settings.business_hours
      ? (["営業時間", settings.business_hours] as [string, string])
      : null,
    settings.closed_days
      ? (["定休日", settings.closed_days] as [string, string])
      : null,
    settings.founded_year
      ? (["創業", `${settings.founded_year}年`] as [string, string])
      : null,
    settings.representative_name
      ? (["代表者", settings.representative_name] as [string, string])
      : null,
  ].filter((row): row is [string, string] => row !== null);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />

      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        店舗情報・アクセス
      </h1>
      <p className="mt-4 text-foreground-muted">
        エムガレージは、クラシックJaguarを専門に取り扱う販売・整備工場です。
        Eタイプ、XK、Mark2をはじめとする往年のJaguarについて、販売から整備・修理・買取まで一貫して承っております。
      </p>

      {storeInfoRows.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            店舗情報
          </h2>
          <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
            {storeInfoRows.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 py-4 sm:flex-row">
                <dt className="font-medium text-charcoal-900 sm:w-32 sm:shrink-0">
                  {label}
                </dt>
                <dd className="text-foreground-muted">
                  {label === "電話番号" ? (
                    <a
                      href={`tel:${value.replace(/[^0-9+]/g, "")}`}
                      className="transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
                    >
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {settings.access_info && (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            アクセス
          </h2>
          {/* 改行を保持して表示する（管理画面のテキストエリアで改行して入力されるため） */}
          <p className="mt-4 whitespace-pre-wrap text-foreground-muted">
            {settings.access_info}
          </p>
        </section>
      )}

      {settings.external_links.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            在庫車両の掲載媒体・公式SNS
          </h2>
          <p className="mt-2 text-foreground-muted">
            最新の入庫状況や日々の作業の様子は、各媒体でもご覧いただけます。
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {settings.external_links.map((link) => (
              <li key={link.url}>
                {/* 外部サイトのためCardのhrefではなくaタグで組み立てる（新しいタブで開くため） */}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ease-premium block rounded-2xl border border-neutral-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-medium motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <div className="space-y-2 p-6">
                    <p className="text-lg font-bold text-charcoal-900">
                      {link.label}
                      <span className="sr-only">
                        （外部サイトを新しいタブで開きます）
                      </span>
                    </p>
                    {link.description && (
                      <p className="text-base text-foreground-muted">
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
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          お問い合わせ
        </h2>
        <p className="mt-2 text-foreground-muted">
          ご来店をご希望の場合は、在庫状況と対応可能なお時間をご案内しますので、事前にご連絡ください。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {settings.line_url && (
            <Button href={settings.line_url} variant="line" size="lg">
              LINEで相談する
            </Button>
          )}
          <Button href="/contact" variant="outline" size="lg">
            フォームから問い合わせる
          </Button>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          取り扱い内容
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardBody>
              <CardTitle>販売</CardTitle>
              <CardMeta>
                クラシックJaguarの在庫車両をご紹介します。ご希望の条件に合わせたお探しのご相談も承ります。
              </CardMeta>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>整備・修理</CardTitle>
              <CardMeta>
                旧車特有の症状を踏まえた整備・修理を行います。過去の作業内容は整備実績のページでご覧いただけます。
              </CardMeta>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>買取</CardTitle>
              <CardMeta>
                長く乗られたJaguarの買取も承ります。まずは車両の状態をお聞かせください。
              </CardMeta>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <CardTitle>ご相談</CardTitle>
              <CardMeta>
                購入前の疑問や、維持にまつわるご不安など、Jaguarに関することは何でもご相談ください。
              </CardMeta>
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  );
}
