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
    // FR-INV-014: 関連記事／関連図鑑／関連ブログ／関連整備実績の紐付け候補
    listRelatedContentCandidates([
      "article",
      "encyclopedia_entry",
      "library_entry",
      "maintenance_record",
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

  const defaultValues: VehicleFormValues = {
    manufacturer_id: vehicle.manufacturer_id,
    model_id: vehicle.model_id,
    series_id: vehicle.series_id,
    generation_id: vehicle.generation_id,
    grade_id: vehicle.grade_id,
    status: vehicle.status,
    is_recommended: vehicle.is_recommended,
    is_new_arrival: vehicle.is_new_arrival,
    price: vehicle.price,
    total_price: vehicle.total_price,
    shaken_status: vehicle.shaken_status,
    legal_maintenance: vehicle.legal_maintenance,
    warranty_type: vehicle.warranty_type,
    warranty_months: vehicle.warranty_months,
    warranty_km: vehicle.warranty_km,
    recycle_fee: vehicle.recycle_fee,
    steering_side: vehicle.steering_side,
    fuel_type: vehicle.fuel_type,
    capacity: vehicle.capacity,
    door_count: vehicle.door_count,
    has_record_book: vehicle.has_record_book,
    is_non_smoking: vehicle.is_non_smoking,
    model_code: vehicle.model_code,
    location_text: vehicle.location_text,
    engine: vehicle.engine,
    engine_model_code: vehicle.engine_model_code,
    displacement_cc: vehicle.displacement_cc,
    horsepower: vehicle.horsepower,
    torque: vehicle.torque,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    body_type: vehicle.body_type,
    model_year: vehicle.model_year,
    registration_year: vehicle.registration_year,
    mileage_km: vehicle.mileage_km,
    shaken_expiry: vehicle.shaken_expiry,
    owner_count: vehicle.owner_count,
    indoor_storage: vehicle.indoor_storage,
    accident_history: vehicle.accident_history,
    interior_color: vehicle.interior_color,
    exterior_color: vehicle.exterior_color,
    seat_material: vehicle.seat_material,
    vin: vehicle.vin,
    sales_comment: vehicle.sales_comment,
    manager_comment: vehicle.manager_comment,
    story: vehicle.story,
    sourcing_background: vehicle.sourcing_background,
    appeal_points: vehicle.appeal_points,
    engine_features: vehicle.engine_features,
    common_issues: vehicle.common_issues,
    maintenance_cost: vehicle.maintenance_cost,
    purchase_notes: vehicle.purchase_notes,
    recommended_points: vehicle.recommended_points,
    maintenance_details: vehicle.maintenance_details,
    custom_details: vehicle.custom_details,
    other_notes: vehicle.other_notes,
    scheduled_publish_at: vehicle.scheduled_publish_at,
    related: related.map((r) => ({ type: r.type, id: r.id })),
    tags: vehicleTags.map((t) => t.id),
    slug: seoMeta?.slug ?? undefined,
    seo: {
      title: seoMeta?.title ?? null,
      description: seoMeta?.description ?? null,
      og_image_url: seoMeta?.og_image_url ?? null,
      canonical_url: seoMeta?.canonical_url ?? null,
    },
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
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
