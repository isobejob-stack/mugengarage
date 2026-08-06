import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// FR-SRCH-001: 車両一覧の絞り込み条件
export interface VehicleSearchFilters {
  manufacturerId?: string;
  modelId?: string;
  seriesId?: string;
  generationId?: string;
  gradeId?: string;
  priceMin?: number;
  priceMax?: number;
  modelYearMin?: number;
  modelYearMax?: number;
  mileageMax?: number;
  transmission?: string;
  indoorStorageOnly?: boolean;
  // 車検満了日の範囲（例：「〇年〇月以降」）。model_year帯の実装パターンを踏襲
  shakenExpiryFrom?: string;
  shakenExpiryTo?: string;
  displacementMin?: number;
  displacementMax?: number;
  horsepowerMin?: number;
  horsepowerMax?: number;
  ownerCountMax?: number;
  interiorColor?: string;
  exteriorColor?: string;
  seatMaterial?: string;
  drivetrain?: string;
  sort?: "new" | "price_asc" | "price_desc";
}

// vehiclesの文字列系カラムから、公開中車両に実在する値だけを選択肢として抽出する（ミッションと同様のパターン）
function distinctStringOptions(
  rows: Array<Record<string, unknown>> | null,
  column: string,
) {
  return Array.from(
    new Set(
      (rows ?? [])
        .map((v) => v[column] as string | null)
        .filter((v): v is string => Boolean(v)),
    ),
  ).sort();
}

export async function getVehicleSearchFacetOptions() {
  const supabase = createAdminClient();
  const [
    { data: manufacturers },
    { data: models },
    { data: series },
    { data: generations },
    { data: grades },
    { data: transmissions },
    { data: interiorColors },
    { data: exteriorColors },
    { data: seatMaterials },
    { data: drivetrains },
  ] = await Promise.all([
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
      .from("series")
      .select("id, name, model_id")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("generations")
      .select("id, name, series_id")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("grades")
      .select("id, name, generation_id")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("vehicles")
      .select("transmission")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("transmission", "is", null),
    supabase
      .from("vehicles")
      .select("interior_color")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("interior_color", "is", null),
    supabase
      .from("vehicles")
      .select("exterior_color")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("exterior_color", "is", null),
    supabase
      .from("vehicles")
      .select("seat_material")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("seat_material", "is", null),
    supabase
      .from("vehicles")
      .select("drivetrain")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("drivetrain", "is", null),
  ]);

  return {
    manufacturers: manufacturers ?? [],
    models: models ?? [],
    series: series ?? [],
    generations: generations ?? [],
    grades: grades ?? [],
    transmissions: distinctStringOptions(transmissions, "transmission"),
    interiorColors: distinctStringOptions(interiorColors, "interior_color"),
    exteriorColors: distinctStringOptions(exteriorColors, "exterior_color"),
    seatMaterials: distinctStringOptions(seatMaterials, "seat_material"),
    drivetrains: distinctStringOptions(drivetrains, "drivetrain"),
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
  if (filters.seriesId) {
    query = query.eq("series_id", filters.seriesId);
  }
  if (filters.generationId) {
    query = query.eq("generation_id", filters.generationId);
  }
  if (filters.gradeId) {
    query = query.eq("grade_id", filters.gradeId);
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
  // 車検満了日の範囲（「〇年〇月以降」＝満了日がこの日付以降＝残り期間が長い車両）
  if (filters.shakenExpiryFrom) {
    query = query.gte("shaken_expiry", filters.shakenExpiryFrom);
  }
  if (filters.shakenExpiryTo) {
    query = query.lte("shaken_expiry", filters.shakenExpiryTo);
  }
  if (filters.displacementMin !== undefined) {
    query = query.gte("displacement_cc", filters.displacementMin);
  }
  if (filters.displacementMax !== undefined) {
    query = query.lte("displacement_cc", filters.displacementMax);
  }
  if (filters.horsepowerMin !== undefined) {
    query = query.gte("horsepower", filters.horsepowerMin);
  }
  if (filters.horsepowerMax !== undefined) {
    query = query.lte("horsepower", filters.horsepowerMax);
  }
  if (filters.ownerCountMax !== undefined) {
    query = query.lte("owner_count", filters.ownerCountMax);
  }
  if (filters.interiorColor) {
    query = query.eq("interior_color", filters.interiorColor);
  }
  if (filters.exteriorColor) {
    query = query.eq("exterior_color", filters.exteriorColor);
  }
  if (filters.seatMaterial) {
    query = query.eq("seat_material", filters.seatMaterial);
  }
  if (filters.drivetrain) {
    query = query.eq("drivetrain", filters.drivetrain);
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
