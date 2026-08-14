import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// FR-SRCH-001: 車両一覧の絞り込み条件
export interface VehicleSearchFilters {
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
  displacementMin?: number;
  displacementMax?: number;
  exteriorColor?: string;
  drivetrain?: string;
  // ISSUE-006: 中古車サイトで最も使われる2条件。
  // どちらも「該当するものだけを見たい」用途しかないため、範囲ではなくON/OFFで持つ。
  shakenAvailableOnly?: boolean;
  noAccidentOnly?: boolean;
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
    { data: models },
    { data: series },
    { data: generations },
    { data: grades },
    { data: transmissions },
    { data: exteriorColors },
    { data: drivetrains },
  ] = await Promise.all([
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
      .select("exterior_color")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("exterior_color", "is", null),
    supabase
      .from("vehicles")
      .select("drivetrain")
      .eq("status", "published")
      .is("deleted_at", null)
      .not("drivetrain", "is", null),
  ]);

  return {
    models: models ?? [],
    series: series ?? [],
    generations: generations ?? [],
    grades: grades ?? [],
    transmissions: distinctStringOptions(transmissions, "transmission"),
    exteriorColors: distinctStringOptions(exteriorColors, "exterior_color"),
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
      "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, status, transmission, is_recommended, is_new_arrival, manufacturers(name), models(name)",
      { count: "exact" },
    )
    .eq("status", "published")
    .is("deleted_at", null);

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
  if (filters.displacementMin !== undefined) {
    query = query.gte("displacement_cc", filters.displacementMin);
  }
  if (filters.displacementMax !== undefined) {
    query = query.lte("displacement_cc", filters.displacementMax);
  }
  if (filters.exteriorColor) {
    query = query.eq("exterior_color", filters.exteriorColor);
  }
  if (filters.drivetrain) {
    query = query.eq("drivetrain", filters.drivetrain);
  }
  // 「車検整備付」または「満了日が残っている」車両。
  // 状態が未登録（null）の車両は、車検があるとは言い切れないため含めない。
  if (filters.shakenAvailableOnly) {
    query = query.in("shaken_status", ["inspection_included", "valid_until"]);
  }
  // 修復歴なし。未登録（null）の車両は「なし」と断定できないため含めない
  // （購入判断に直結する項目で、推測で対象に含めると実害が出る）。
  if (filters.noAccidentOnly) {
    query = query.eq("accident_history", false);
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
    total_price: number | null;
    model_year: number | null;
    mileage_km: number | null;
    shaken_status: string | null;
    shaken_expiry: string | null;
    accident_history: boolean | null;
    status: string;
    transmission: string | null;
    is_recommended: boolean;
    is_new_arrival: boolean;
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
