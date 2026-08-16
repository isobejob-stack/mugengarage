import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/ui/markdown";
import { getPublicOwnerArchiveEntryByVehicleId } from "@/lib/archive/queries";
import { getVehiclePhotos, getVehicleVideos } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { VehicleMediaGallery } from "@/components/inventory/vehicle-media-gallery";
import { StatusBadge } from "@/components/ui/status-badge";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { RelatedInventorySection } from "@/components/related/related-discovery";
import { getVehiclesRelatedToTitle } from "@/lib/related/auto";
import { getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getSiteSettings } from "@/lib/settings/queries";
import { buildLineConsultationUrl } from "@/lib/site-config";

// 車両名を組み立ててtitleに使う。従来はルートlayoutの値を継承しており、
// アーカイブ全件が検索結果で同じ文言になっていた（docs/tasks/ISSUE-005）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}): Promise<Metadata> {
  const { vehicleId } = await params;
  const entry = await getPublicOwnerArchiveEntryByVehicleId(vehicleId);

  if (!entry) return {};

  const displayName =
    [
      entry.vehicles?.manufacturers?.name,
      entry.vehicles?.models?.name,
      entry.vehicles?.model_year ? `${entry.vehicles.model_year}年` : null,
    ]
      .filter(Boolean)
      .join(" ") || "販売実績";

  return buildPageMetadata({
    title: displayName,
    description:
      excerptFromMarkdown(entry.restoration_history) ||
      excerptFromMarkdown(entry.sales_history) ||
      `${displayName}の販売実績・レストア履歴をご紹介します。`,
    path: `/owners-archive/${vehicleId}`,
  });
}

// SCR-PUB-016: オーナーズアーカイブ詳細（レストア履歴・販売履歴、FR-OWN-001〜003。FR-OWN-002の写真部分）
export default async function Page({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const entry = await getPublicOwnerArchiveEntryByVehicleId(vehicleId);

  if (!entry) {
    notFound();
  }

  const [photos, videos] = await Promise.all([
    getVehiclePhotos(vehicleId),
    getVehicleVideos(vehicleId),
  ]);
  const photosWithUrl = photos.map((photo) => ({
    id: photo.id,
    public_url: getVehiclePhotoPublicUrl(photo.storage_path),
  }));
  // UIUXデザイナーレビュー指摘: ギャラリー画像のalt属性に使う車両名（メーカー・モデル・年式）
  const vehicleName = [
    entry.vehicles?.manufacturers?.name,
    entry.vehicles?.models?.name,
    entry.vehicles?.model_year ? `${entry.vehicles.model_year}年` : null,
  ]
    .filter(Boolean)
    .join(" ");

  // このページは「この店が実際にこう仕上げて、実際に売った」という最も強い信頼材料で、
  // 読み終えた直後がもっとも購買意欲の高い瞬間になる。
  // 一方この車はもう買えないため、次の行き先を示さないと確実に離脱する。
  const { modelName: relatedModelName, vehicles: relatedVehicles } =
    await getVehiclesRelatedToTitle(vehicleName);
  const relatedPhotoPaths = await getLeadVehiclePhotoPaths(
    relatedVehicles.map((v) => v.id),
  );
  const relatedPhotoUrls = relatedVehicles.map((v) => {
    const path = relatedPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : undefined;
  });
  const settings = await getSiteSettings();
  const lineConsultUrl = buildLineConsultationUrl(
    settings.line_url,
    "purchase",
    vehicleName,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "オーナーズアーカイブ", href: "/owners-archive" },
          { label: vehicleName },
        ]}
      />
      <div className="mt-4">
        <StatusBadge label="ご成約済み" tone="neutral" />
      </div>
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {entry.vehicles?.manufacturers?.name} {entry.vehicles?.models?.name}
        {entry.vehicles?.model_year ? `（${entry.vehicles.model_year}年）` : ""}
      </h1>
      {entry.vehicles?.engine && (
        <p className="text-foreground-muted mt-2">{entry.vehicles.engine}</p>
      )}

      <div className="mt-6">
        <VehicleMediaGallery
          photos={photosWithUrl}
          videos={videos}
          vehicleName={vehicleName}
        />
      </div>

      {entry.restoration_history && (
        <section className="mt-8">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            レストア履歴
          </h2>
          <div className="prose mt-2 max-w-none">
            <Markdown>
              {entry.restoration_history}
            </Markdown>
          </div>
        </section>
      )}

      {entry.sales_history && (
        <section className="mt-8">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            販売履歴
          </h2>
          <div className="prose mt-2 max-w-none">
            <Markdown>
              {entry.sales_history}
            </Markdown>
          </div>
        </section>
      )}
      {relatedVehicles.length > 0 ? (
        <RelatedInventorySection
          vehicles={relatedVehicles}
          photoUrls={relatedPhotoUrls}
          topic={relatedModelName ?? ""}
        />
      ) : (
        // 同車種の在庫が無いときこそ、希望を聞き出す価値がある。
        // 「もう買えない車を見て終わり」にせず、入荷案内につなげる。
        <section className="bg-cream-100 mt-16 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            同じような車両をお探しですか
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            ご希望をお聞かせいただければ、入荷時にご案内いたします。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/vehicles" variant="primary" size="md">
              在庫車両を見る
            </Button>
            {lineConsultUrl && (
              <Button href={lineConsultUrl} variant="line" size="md">
                LINEで相談する
              </Button>
            )}
          </div>
        </section>
      )}

      <div className="mt-10 flex justify-center border-t border-neutral-200 pt-8">
        <Button href="/owners-archive" variant="outline" size="md">
          オーナーズアーカイブ一覧に戻る
        </Button>
      </div>
    </main>
  );
}
