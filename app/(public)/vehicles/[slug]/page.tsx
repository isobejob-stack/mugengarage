import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  getPublicVehicleBySlug,
  getVehiclePhotos,
  getVehicleVideos,
} from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import { FavoriteButton } from "@/components/engagement/favorite-button";
import { getSessionId } from "@/lib/engagement/session";
import { listFavoriteVehicleIds } from "@/lib/engagement/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { VehicleMediaGallery } from "@/components/inventory/vehicle-media-gallery";
import { getSeoMeta } from "@/lib/seo/queries";
import { buildPublicPath } from "@/lib/seo/paths";
import { buildVehicleStructuredData } from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site-config";

function buildVehicleDisplayName(vehicle: {
  manufacturers: { name: string } | null;
  models: { name: string } | null;
  model_year: number | null;
}) {
  return [
    vehicle.manufacturers?.name,
    vehicle.models?.name,
    vehicle.model_year ? `${vehicle.model_year}年` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

// FR-INV-011 / FR-SEO-001: 車両ごとに設定されたSEOメタ情報（Title/Description/OGP/Canonical）を
// generateMetadataで反映する。未設定の場合は車両情報から自動生成した値をフォールバックとして使う。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);

  if (!vehicle) {
    return {};
  }

  const seoMeta = await getSeoMeta("vehicle", vehicle.id);
  const displayName = buildVehicleDisplayName(vehicle);
  const title = seoMeta?.title || `${displayName}｜M-GARAGE Platform`;
  const description =
    seoMeta?.description ||
    vehicle.sales_comment ||
    vehicle.appeal_points ||
    `${displayName}の車両詳細ページです。`;
  const canonicalPath = buildPublicPath("vehicle", slug) ?? `/vehicles/${slug}`;
  const canonicalUrl = seoMeta?.canonical_url || `${SITE_URL}${canonicalPath}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: seoMeta?.og_image_url ? [seoMeta.og_image_url] : undefined,
    },
  };
}

// SCR-PUB-003: 車両詳細（FR-VEH-001, 002, 003, 005, 006, 008。FR-INV-010: 動画埋め込み）
// FR-SEO-002: Schema.org構造化データ（JSON-LD）をVehicle/Productスキーマ（Car型）で出力する
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  const sessionId = await getSessionId();
  const [favoriteIds, related, photos, videos] = await Promise.all([
    sessionId ? listFavoriteVehicleIds(sessionId) : Promise.resolve([]),
    listRelatedContents("vehicle", vehicle.id),
    getVehiclePhotos(vehicle.id),
    getVehicleVideos(vehicle.id),
  ]);
  const isFavorited = favoriteIds.includes(vehicle.id);
  const photosWithUrl = photos.map((photo) => ({
    id: photo.id,
    public_url: getVehiclePhotoPublicUrl(photo.storage_path),
  }));
  // UIUXデザイナーレビュー指摘: ギャラリー画像のalt属性に使う車両名（メーカー・モデル・年式）
  const vehicleName = buildVehicleDisplayName(vehicle);

  const markdownSections: Array<[string, string | null]> = [
    ["この車の魅力", vehicle.appeal_points],
    ["販売コメント", vehicle.sales_comment],
    ["店長コメント", vehicle.manager_comment],
    ["ストーリー", vehicle.story],
    ["エンジンの特徴", vehicle.engine_features],
    ["よくある故障", vehicle.common_issues],
    ["維持費", vehicle.maintenance_cost],
  ];

  // FR-SEO-002: 構造化データ（JSON-LD）。canonical URLはgenerateMetadataと同じ導出ロジックを使う
  const seoMeta = await getSeoMeta("vehicle", vehicle.id);
  const canonicalPath = buildPublicPath("vehicle", slug) ?? `/vehicles/${slug}`;
  const canonicalUrl = seoMeta?.canonical_url || `${SITE_URL}${canonicalPath}`;
  const structuredData = buildVehicleStructuredData({
    vehicle,
    name: vehicleName,
    description: seoMeta?.description ?? vehicle.sales_comment,
    images: photosWithUrl.map((p) => p.public_url),
    url: canonicalUrl,
  });

  // レビュー指摘対応（必須修正4）: JSON-LDの中身は車両詳細（管理者入力を含む）から組み立てているため、
  // `</script>` 等のシーケンスが紛れ込んでいた場合にscriptタグを閉じてしまう
  // スクリプトインジェクションを防ぐ。`<` を `<` にエスケープすることでHTMLタグとして解釈されなくする
  // （JSON構文上は問題なく、JSON.parseで元の文字列に戻る）。
  const structuredDataJson = JSON.stringify(structuredData).replace(
    /</g,
    "\\u003c",
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <VehicleStatusBadge status={vehicle.status} />
      <h1 className="mt-2 text-2xl font-bold">
        {vehicle.manufacturers?.name} {vehicle.models?.name}
        {vehicle.model_year ? `（${vehicle.model_year}年）` : ""}
      </h1>
      <p className="mt-2 text-2xl font-bold">
        ¥{vehicle.price.toLocaleString()}
      </p>

      <div className="mt-4">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={isFavorited} />
      </div>

      <div className="mt-6">
        <VehicleMediaGallery
          photos={photosWithUrl}
          videos={videos}
          vehicleName={vehicleName}
        />
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          {vehicle.mileage_km !== null && (
            <Row
              label="走行距離"
              value={`${vehicle.mileage_km.toLocaleString()}km`}
            />
          )}
          {vehicle.engine && <Row label="エンジン" value={vehicle.engine} />}
          {vehicle.transmission && (
            <Row label="ミッション" value={vehicle.transmission} />
          )}
          {vehicle.exterior_color && (
            <Row label="外装色" value={vehicle.exterior_color} />
          )}
          {vehicle.interior_color && (
            <Row label="内装色" value={vehicle.interior_color} />
          )}
          {vehicle.vin && <Row label="VIN" value={vehicle.vin} />}
        </tbody>
      </table>

      {markdownSections
        .filter(([, body]) => Boolean(body))
        .map(([title, body]) => (
          <section key={title} className="mt-8">
            <h2 className="text-lg font-bold">{title}</h2>
            <div className="prose mt-2 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </section>
        ))}

      <RelatedContentList items={related} title="関連コンテンツ" />

      <div className="mt-10 border-t border-neutral-200 pt-6">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={isFavorited} />
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-neutral-200">
      <th className="w-32 py-2 text-left font-medium text-neutral-500">
        {label}
      </th>
      <td className="py-2">{value}</td>
    </tr>
  );
}
