import { notFound } from "next/navigation";
import {
  getAdminVehicleById,
  getVehicleHierarchyOptions,
  getVehiclePhotos,
  getVehicleVideos,
} from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { VehicleForm } from "@/components/inventory/vehicle-form";
import type { VehicleFormValues } from "@/lib/inventory/schema";
import { toVehicleFormValues } from "@/lib/inventory/form-values";
import { getSeoMeta } from "@/lib/seo/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { listTags, listTagsForTaggable } from "@/lib/tags/queries";

// SCR-ADM-004: 車両編集フォーム
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [
    vehicle,
    options,
    photos,
    videos,
    seoMeta,
    candidates,
    related,
    allTags,
    vehicleTags,
  ] = await Promise.all([
    getAdminVehicleById(id),
    getVehicleHierarchyOptions(),
    getVehiclePhotos(id),
    getVehicleVideos(id),
    // FR-INV-011: SEO編集フォームの初期値として、slug・SEOメタ情報も併せて取得する
    getSeoMeta("vehicle", id),
    // FR-INV-014: 関連記事／関連図鑑／関連ライブラリの紐付け候補
    // 整備実績はブログへ統合したため、記事（category='整備記録'）として article に含まれる
    listRelatedContentCandidates([
      "article",
      "encyclopedia_entry",
      "library_entry",
    ]),
    listRelatedContents("vehicle", id),
    // FR-INV-012: タグ選択候補・現在の紐付けタグ
    listTags(),
    listTagsForTaggable("vehicle", id),
  ]);

  if (!vehicle) {
    notFound();
  }

  // FR-INV-009: サムネイル表示用に公開URLを付与しておく
  const photosWithUrl = photos.map((photo) => ({
    ...photo,
    public_url: getVehiclePhotoPublicUrl(photo.storage_path),
  }));

  const defaultValues: VehicleFormValues = toVehicleFormValues(vehicle, {
    related,
    tagIds: vehicleTags.map((t) => t.id),
    slug: seoMeta?.slug ?? undefined,
    seo: {
      title: seoMeta?.title ?? null,
      description: seoMeta?.description ?? null,
      og_image_url: seoMeta?.og_image_url ?? null,
      canonical_url: seoMeta?.canonical_url ?? null,
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        車両編集
      </h1>
      <div className="mt-6">
        <VehicleForm
          options={options}
          vehicleId={vehicle.id}
          defaultValues={defaultValues}
          initialPhotos={photosWithUrl}
          initialVideos={videos}
          candidates={candidates}
          allTags={allTags}
        />
      </div>
    </main>
  );
}
