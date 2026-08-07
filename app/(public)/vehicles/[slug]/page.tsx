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
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/engagement/favorite-button";
import { getSessionId } from "@/lib/engagement/session";
import { listFavoriteVehicleIds } from "@/lib/engagement/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { VehicleMediaGallery } from "@/components/inventory/vehicle-media-gallery";
import { getSeoMeta } from "@/lib/seo/queries";
import { buildPublicPath } from "@/lib/seo/paths";
import { buildVehicleStructuredData } from "@/lib/seo/structured-data";
import { SITE_URL, buildLineConsultationUrl } from "@/lib/site-config";

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
    <main className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <VehicleStatusBadge status={vehicle.status} />
      <h1 className="mt-3 font-serif text-3xl font-bold text-charcoal-900">
        {vehicle.manufacturers?.name} {vehicle.models?.name}
        {vehicle.model_year ? `（${vehicle.model_year}年）` : ""}
      </h1>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-primary-700">
        ¥{vehicle.price.toLocaleString()}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={isFavorited} />
        {/* FR-LINE-002: 車両詳細ページでは「購入」カテゴリに固定した相談導線を表示する。
            レビュー指摘対応（必須修正3）: プリフィル文言に車両名を含め、ボタン文言と送信内容を一致させる */}
        <Button href={buildLineConsultationUrl("purchase", vehicleName)} variant="line" size="md">
          この車をLINEで相談する
        </Button>
      </div>

      <div className="mt-8">
        <VehicleMediaGallery
          photos={photosWithUrl}
          videos={videos}
          vehicleName={vehicleName}
        />
      </div>

      <section className="mt-14">
        <h2 className="font-serif text-lg font-bold text-charcoal-900">
          車両情報
        </h2>
        {/* product-design-manager/graphic-designer策定方針「ショールーム的な高級感」に基づき、
            細罫線のみのtableから、ラベル＋値をカード風に並べる2カラムグリッドへ変更。
            データ構造（label/value props）はRowコンポーネントとして維持する。
            UIUXレビュー指摘（事業責任者協議事項）: 01_public_ui_spec.mdが求める
            「メーカー〜VINまでの全項目」のうち従来6項目しか表示していなかったため、
            既存データベースに値がある残りの項目もあわせて表示するようにした。 */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {vehicle.model_year !== null && (
            <Row label="年式" value={`${vehicle.model_year}年`} />
          )}
          {vehicle.registration_year !== null && (
            <Row label="登録年" value={`${vehicle.registration_year}年`} />
          )}
          {vehicle.mileage_km !== null && (
            <Row
              label="走行距離"
              value={`${vehicle.mileage_km.toLocaleString()}km`}
            />
          )}
          {vehicle.engine && <Row label="エンジン" value={vehicle.engine} />}
          {vehicle.engine_model_code && (
            <Row label="エンジン型式" value={vehicle.engine_model_code} />
          )}
          {vehicle.displacement_cc !== null && (
            <Row
              label="排気量"
              value={`${vehicle.displacement_cc.toLocaleString()}cc`}
            />
          )}
          {vehicle.horsepower !== null && (
            <Row label="馬力" value={`${vehicle.horsepower}ps`} />
          )}
          {vehicle.torque && <Row label="トルク" value={vehicle.torque} />}
          {vehicle.transmission && (
            <Row label="ミッション" value={vehicle.transmission} />
          )}
          {vehicle.drivetrain && (
            <Row label="駆動方式" value={vehicle.drivetrain} />
          )}
          {vehicle.body_type && (
            <Row label="ボディタイプ" value={vehicle.body_type} />
          )}
          {vehicle.exterior_color && (
            <Row label="外装色" value={vehicle.exterior_color} />
          )}
          {vehicle.interior_color && (
            <Row label="内装色" value={vehicle.interior_color} />
          )}
          {vehicle.seat_material && (
            <Row label="シート素材" value={vehicle.seat_material} />
          )}
          {vehicle.owner_count !== null && (
            <Row label="オーナー数" value={`${vehicle.owner_count}人`} />
          )}
          {vehicle.shaken_expiry && (
            <Row label="車検満了日" value={vehicle.shaken_expiry} />
          )}
          {vehicle.indoor_storage !== null && (
            <Row
              label="保管状況"
              value={vehicle.indoor_storage ? "屋内保管" : "屋外保管"}
            />
          )}
          {vehicle.accident_history !== null && (
            <Row
              label="事故歴"
              value={vehicle.accident_history ? "あり" : "なし"}
            />
          )}
          {vehicle.vin && (
            <div className="col-span-2 sm:col-span-3">
              <Row label="VIN" value={vehicle.vin} breakAll />
            </div>
          )}
        </div>
      </section>

      {markdownSections
        .filter(([, body]) => Boolean(body))
        .map(([title, body]) => (
          <section key={title} className="mt-14">
            <h2 className="font-serif text-lg font-bold text-charcoal-900">
              {title}
            </h2>
            <div className="prose mt-3 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </section>
        ))}

      <RelatedContentList items={related} title="関連コンテンツ" />

      <div className="mt-16 border-t border-neutral-200 pt-8">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={isFavorited} />
      </div>

      {/* レビュー指摘対応（必須修正4）: 01_public_ui_spec.md 5章（SCR-PUB-003, FR-VEH-007）
          「LINE相談CTAは常に画面下部に固定表示することを推奨」に基づく画面下部固定バー。
          冒頭のインラインCTAは早期離脱者への導線として維持したまま併存させる。
          ヘッダーは固定表示ではないため干渉なし。ライトボックス（z-50）より低いz-indexとし、
          モーダル表示中はこのバーの上にライトボックスが正しく重なるようにする。
          fixedを使用（sticky+100vwのフルブリードは縦スクロールバー幅分の横スクロールが
          発生するため不採用）。<main>側にバー高さ分のpadding-bottomを確保済み。 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 shadow-strong backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-center px-4 sm:h-16">
          <Button
            href={buildLineConsultationUrl("purchase", vehicleName)}
            variant="line"
            size="md"
            className="w-full max-w-xs"
          >
            この車をLINEで相談する
          </Button>
        </div>
      </div>
    </main>
  );
}

// スペック1件分の表示。カード風の背景・角丸・薄い罫線で「ショールーム的な高級感」を演出する。
// 既存のlabel/value propsは維持したまま、表示方法（table row → gridアイテム）のみ変更している。
// UIUXレビュー指摘: VIN等スペースを含まない連続文字列がgridトラックを押し広げ横スクロールを
// 引き起こしうるため、breakAll（VIN専用）とデフォルトのbreak-words（日本語の色名等）で対応する。
function Row({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-cream-50 px-4 py-3 shadow-soft">
      <p className="text-base font-medium text-foreground-muted">{label}</p>
      <p
        className={`mt-1 text-base font-semibold text-charcoal-900 ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
