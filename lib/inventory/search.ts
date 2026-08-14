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

// 車種階層（車種・シリーズ・世代・グレード）の選択肢。
//
// 従来はマスタを全件返していた。マスタは図鑑（Jaguarの全車種を体系的に紹介する）と
// 共用のため在庫より遥かに多く、選んでも必ず0件になる選択肢が大量に並んでいた。
// 「選べたのに0件」は、探している側から見ると検索が壊れているのと区別が付かない。
// 実在値から選択肢を作る点は、ミッション・色・駆動方式と同じ考え方に揃える。
async function buildHierarchyOptions(
  supabase: ReturnType<typeof createAdminClient>,
  table: "models" | "series" | "generations" | "grades",
  countById: Map<string, number>,
) {
  const ids = Array.from(countById.keys());
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from(table)
    .select("id, name")
    .in("id", ids)
    .is("deleted_at", null)
    .order("name");

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    count: countById.get(row.id as string) ?? 0,
  }));
}

function countByColumn(
  rows: Array<Record<string, unknown>> | null,
  column: string,
) {
  const counts = new Map<string, number>();
  for (const row of rows ?? []) {
    const value = row[column] as string | null;
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export async function getVehicleSearchFacetOptions() {
  const supabase = createAdminClient();

  // 絞り込みに使う列をまとめて1回だけ読む。
  // 以前は項目ごとに1クエリ（計7本）投げていたが、対象は同じ「公開中の車両」であり、
  // 1本で取って集計すれば足りる。
  const { data: publishedVehicles } = await supabase
    .from("vehicles")
    .select(
      "model_id, series_id, generation_id, grade_id, transmission, exterior_color, drivetrain",
    )
    .eq("status", "published")
    .is("deleted_at", null);

  const [models, series, generations, grades] = await Promise.all([
    buildHierarchyOptions(
      supabase,
      "models",
      countByColumn(publishedVehicles, "model_id"),
    ),
    buildHierarchyOptions(
      supabase,
      "series",
      countByColumn(publishedVehicles, "series_id"),
    ),
    buildHierarchyOptions(
      supabase,
      "generations",
      countByColumn(publishedVehicles, "generation_id"),
    ),
    buildHierarchyOptions(
      supabase,
      "grades",
      countByColumn(publishedVehicles, "grade_id"),
    ),
  ]);

  return {
    models,
    series,
    generations,
    grades,
    transmissions: distinctStringOptions(publishedVehicles, "transmission"),
    exteriorColors: distinctStringOptions(publishedVehicles, "exterior_color"),
    drivetrains: distinctStringOptions(publishedVehicles, "drivetrain"),
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
      // grades: 旧車は同じ車種でもグレードで価格が大きく変わるため、
      // 一覧の車名は「メーカー + 車種 + グレード」まで出す（ISSUE-006 3.1）
      "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, status, transmission, is_recommended, is_new_arrival, manufacturers(name), models(name), grades(name)",
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
    grades: { name: string } | null;
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
