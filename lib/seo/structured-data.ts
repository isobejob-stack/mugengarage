import type { Vehicle } from "@/lib/inventory/types";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

// JSON-LDは管理画面からの入力（記事本文・車両説明等）を含むため、`</script>` の混入で
// scriptタグを閉じられないよう `<` をエスケープしてから埋め込む。
// JSON構文上は問題なく、JSON.parseで元の文字列に戻る。
// 各ページで書くと1箇所で忘れた瞬間に穴になるため、ここに集約する。
export function serializeStructuredData(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// 発行元。記事・用語の両方で同じ事業者を指すため共通化する。
const publisher = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
};

// FR-SEO-002: ブログ記事の構造化データ。
// 記事が「いつ・誰が書いた何についての文章か」を検索エンジンに明示する。
// 投入済みのコンテンツ資産をそのまま検索露出に変えるための実装で、
// 新しく記事を書く必要がない（docs/tasks/ISSUE-005 4章）。
export function buildArticleStructuredData(params: {
  title: string;
  description: string;
  url: string;
  publishedAt: string | null;
  updatedAt: string | null;
  category: string | null;
}) {
  const { title, description, url, publishedAt, updatedAt, category } = params;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    ...(description ? { description } : {}),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(publishedAt ? { datePublished: publishedAt } : {}),
    ...(updatedAt ? { dateModified: updatedAt } : {}),
    ...(category ? { articleSection: category } : {}),
    author: publisher,
    publisher,
  };
}

// FR-SEO-002: 用語ライブラリの構造化データ。
// 「SUキャブレターとは」のような語の意味を探す検索に対して、
// このページが用語の定義であることを示す（schema.org DefinedTerm）。
export function buildDefinedTermStructuredData(params: {
  term: string;
  description: string;
  url: string;
  category: string | null;
}) {
  const { term, description, url, category } = params;

  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term,
    ...(description ? { description } : {}),
    url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${SITE_NAME} Jaguar用語ライブラリ`,
      url: `${SITE_URL}/library`,
    },
    ...(category ? { termCode: category } : {}),
  };
}

// FR-SEO-002: 車両詳細ページ用のSchema.org構造化データ（JSON-LD）を生成する。
// schema.orgの Car（Vehicle ⊂ Product のサブタイプ）を用い、中古車販売店向けの
// Google Vehicle Listing構造化データの形式に準拠する。
export function buildVehicleStructuredData(params: {
  vehicle: Vehicle & {
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  };
  name: string;
  description: string | null;
  images: string[];
  url: string;
}) {
  const { vehicle, name, description, images, url } = params;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name,
    url,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(vehicle.manufacturers?.name
      ? { brand: { "@type": "Brand", name: vehicle.manufacturers.name } }
      : {}),
    ...(vehicle.models?.name ? { model: vehicle.models.name } : {}),
    ...(vehicle.model_year
      ? { vehicleModelDate: String(vehicle.model_year) }
      : {}),
    ...(vehicle.vin ? { vehicleIdentificationNumber: vehicle.vin } : {}),
    ...(vehicle.body_type ? { bodyType: vehicle.body_type } : {}),
    ...(vehicle.transmission
      ? { vehicleTransmission: vehicle.transmission }
      : {}),
    ...(vehicle.drivetrain
      ? { driveWheelConfiguration: vehicle.drivetrain }
      : {}),
    ...(vehicle.exterior_color ? { color: vehicle.exterior_color } : {}),
    ...(vehicle.owner_count !== null
      ? { numberOfPreviousOwners: vehicle.owner_count }
      : {}),
    ...(vehicle.mileage_km !== null
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: vehicle.mileage_km,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(vehicle.engine
      ? {
          vehicleEngine: {
            "@type": "EngineSpecification",
            name: vehicle.engine,
            ...(vehicle.horsepower
              ? {
                  enginePower: {
                    "@type": "QuantitativeValue",
                    value: vehicle.horsepower,
                    unitText: "PS",
                  },
                }
              : {}),
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "JPY",
      // このJSON-LDはstatus='published'の車両詳細ページでのみ出力される（getPublicVehicleBySlug参照）
      availability: "https://schema.org/InStock",
      url,
    },
  };

  return structuredData;
}
