import { buildPageMetadata } from "@/lib/seo/metadata";
import { EXTERNAL_LINKS, LINE_URL, SITE_NAME, SITE_URL } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle, CardMeta } from "@/components/ui/card";

export const metadata = buildPageMetadata({
  title: "店舗情報・アクセス",
  description:
    "クラシックJaguar専門店エムガレージの店舗情報とアクセスのご案内です。在庫車両の掲載媒体・公式SNSもご覧いただけます。",
  path: "/about",
});

// FR-SEO-002: 事業者の構造化データ。住所・電話番号・営業時間は未確定のため現時点では出力しない。
// 誤った情報を構造化データとして出すと検索エンジンに誤った事業者情報を学習させてしまうため、
// 確定している項目（名称・URL・公式SNS/掲載媒体）のみを記述する。
// sameAsに公式アカウントを列挙することで、それらが同一事業者のものであると伝えられる。
const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: SITE_NAME,
  description: "クラシックJaguar専門店",
  url: SITE_URL,
  sameAs: EXTERNAL_LINKS.map((link) => link.href),
};

// SCR-PUB-018: 店舗情報・アクセス
export default function Page() {
  // 車両詳細と同じ方針で、JSON-LD内の "<" をエスケープしてscriptタグの早期終了を防ぐ
  const structuredDataJson = JSON.stringify(organizationStructuredData).replace(
    /</g,
    "\\u003c",
  );

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

      <section className="mt-12">
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          在庫車両の掲載媒体・公式SNS
        </h2>
        <p className="mt-2 text-foreground-muted">
          最新の入庫状況や日々の作業の様子は、各媒体でもご覧いただけます。
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {EXTERNAL_LINKS.map((link) => (
            <li key={link.id}>
              {/* 外部サイトのためCardのhrefではなくaタグで組み立てる（新しいタブで開くため） */}
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ease-premium block rounded-2xl border border-neutral-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-medium motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="space-y-2 p-6">
                  <p className="text-lg font-bold text-charcoal-900">
                    {link.label}
                    <span className="sr-only">（外部サイトを新しいタブで開きます）</span>
                  </p>
                  <p className="text-base text-foreground-muted">
                    {link.description}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          お問い合わせ
        </h2>
        <p className="mt-2 text-foreground-muted">
          ご来店をご希望の場合は、在庫状況と対応可能なお時間をご案内しますので、事前にご連絡ください。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={LINE_URL} variant="line" size="lg">
            LINEで相談する
          </Button>
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
