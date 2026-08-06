import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// FR-SRCH-001: 車両一覧の絞り込み条件（主要項目のみ。カーセンサー風の全項目対応は今後拡張）
export interface VehicleSearchFilters {
  manufacturerId?: string;
  modelId?: string;
  priceMin?: number;
  priceMax?: number;
  modelYearMin?: number;
  modelYearMax?: number;
  mileageMax?: number;
  transmission?: string;
  indoorStorageOnly?: boolean;
  sort?: "new" | "price_asc" | "price_desc";
}

export async function getVehicleSearchFacetOptions() {
  const supabase = createAdminClient();
  const [{ data: manufacturers }, { data: models }, { data: transmissions }] =
    await Promise.all([
      supabase
        .from("manufacturers")
        .select("id, name")
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("models")
        .select("id, name, manufacturer_id")
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("vehicles")
        .select("transmission")
        .eq("status", "published")
        .is("deleted_at", null)
        .not("transmission", "is", null),
    ]);

  const transmissionOptions = Array.from(
    new Set((transmissions ?? []).map((v) => v.transmission as string)),
  ).sort();

  return {
    manufacturers: manufacturers ?? [],
    models: models ?? [],
    transmissions: transmissionOptions,
  };
}

// FR-SRCH-001〜002: 複合条件での絞り込み検索（公開中の車両のみ）
export async function searchPublicVehicles(
  filters: VehicleSearchFilters,
  pagination: PaginationParams,
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("vehicles")
    .select(
      "id, price, model_year, mileage_km, status, transmission, manufacturers(name), models(name)",
      { count: "exact" },
    )
    .eq("status", "published")
    .is("deleted_at", null);

  if (filters.manufacturerId) {
    query = query.eq("manufacturer_id", filters.manufacturerId);
  }
  if (filters.modelId) {
    query = query.eq("model_id", filters.modelId);
  }
  if (filters.priceMin !== undefined) {
    query = query.gte("price", filters.priceMin);
  }
  if (filters.priceMax !== undefined) {
    query = query.lte("price", filters.priceMax);
  }
  if (filters.modelYearMin !== undefined) {
    query = query.gte("model_year", filters.modelYearMin);
  }
  if (filters.modelYearMax !== undefined) {
    query = query.lte("model_year", filters.modelYearMax);
  }
  if (filters.mileageMax !== undefined) {
    query = query.lte("mileage_km", filters.mileageMax);
  }
  if (filters.transmission) {
    query = query.eq("transmission", filters.transmission);
  }
  if (filters.indoorStorageOnly) {
    query = query.eq("indoor_storage", true);
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("display_order", { ascending: true });
  }

  const [from, to] = toRange(pagination);
  query = query.range(from, to);

  const { data, count } = await query;

  const vehicles = (data ?? []) as unknown as Array<{
    id: string;
    price: number;
    model_year: number | null;
    mileage_km: number | null;
    status: string;
    transmission: string | null;
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  }>;

  if (vehicles.length === 0) {
    return { vehicles: [], totalCount: count ?? 0 };
  }

  const { data: seoMetas } = await supabase
    .from("seo_metas")
    .select("target_id, slug")
    .eq("target_type", "vehicle")
    .in(
      "target_id",
      vehicles.map((v) => v.id),
    );
  const slugByVehicleId = new Map(
    (seoMetas ?? []).map((s) => [s.target_id, s.slug]),
  );

  return {
    vehicles: vehicles.map((v) => ({
      ...v,
      slug: slugByVehicleId.get(v.id) ?? null,
    })),
    totalCount: count ?? 0,
  };
}
