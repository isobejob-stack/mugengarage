import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaginationParams } from "@/lib/api/pagination";
import { toRange } from "@/lib/api/pagination";

// FR-SRCH-001: 車両一覧の絞り込み条件
//
// 2026-08-17、発注者の指示で条件を絞った。
// 削除したのは シリーズ／世代／グレード／ミッション／駆動方式／外装色／車検あり／修復歴なし。
// 在庫15台規模の店で条件を10個以上並べると、ほとんどの条件が「選ぶと1〜2台」になり、
// 絞り込みではなく選別作業になってしまう。実際に探す側が最初に決めるのは
// 「どの車種か・いくらまでか・いつ頃の車か・どれだけ走っているか・どのエンジンか」で、
// 色や駆動方式はその5つを決めたあとに詳細ページで確認する情報でしかない。
// 残した項目はいずれも、値が決まれば候補が実際に絞れるものに揃えている。
export interface VehicleSearchFilters {
  modelId?: string;
  priceMin?: number;
  priceMax?: number;
  modelYearMin?: number;
  modelYearMax?: number;
  mileageMax?: number;
  displacementMin?: number;
  displacementMax?: number;
  sort?: VehicleSortKey;
}

// 並び替えの選択肢。
// 価格・新着に加えて、旧車を探すときに実際に使われる3軸を足した（2026-08-17）。
// 排気量はクラシックJaguarでは「どのエンジンを積んだ個体か」とほぼ同義であり、
// 走行距離・年式はコンディションと価格の根拠として必ず見られる。
export type VehicleSortKey =
  | "new"
  | "price_asc"
  | "price_desc"
  | "displacement_desc"
  | "year_desc"
  | "mileage_asc";

// 車種の選択肢。
//
// マスタを全件返さず、公開中の在庫に実在する車種だけを台数付きで返す。
// マスタは図鑑（Jaguarの全車種を体系的に紹介する）と共用のため在庫より遥かに多く、
// 全件出すと「選べたのに0件」になる選択肢が大量に並ぶ。
export async function getVehicleSearchFacetOptions() {
  const supabase = createAdminClient();

  const { data: publishedVehicles } = await supabase
    .from("vehicles")
    .select("model_id")
    .eq("status", "published")
    .is("deleted_at", null);

  const countByModelId = new Map<string, number>();
  for (const row of publishedVehicles ?? []) {
    const modelId = row.model_id as string | null;
    if (!modelId) continue;
    countByModelId.set(modelId, (countByModelId.get(modelId) ?? 0) + 1);
  }

  const ids = Array.from(countByModelId.keys());
  if (ids.length === 0) return { models: [] };

  const { data } = await supabase
    .from("models")
    .select("id, name")
    .in("id", ids)
    .is("deleted_at", null)
    .order("name");

  return {
    models: (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      count: countByModelId.get(row.id as string) ?? 0,
    })),
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
  if (filters.displacementMin !== undefined) {
    query = query.gte("displacement_cc", filters.displacementMin);
  }
  if (filters.displacementMax !== undefined) {
    query = query.lte("displacement_cc", filters.displacementMax);
  }

  // 排気量・年式・走行距離は未入力（null）の車両があり得る。
  // 未入力を先頭に持ってくると「並び替えたのに関係ない車が最初に来る」状態になるため、
  // どの並び順でも未入力は末尾に送る（nullsFirst: false）。
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
    case "displacement_desc":
      query = query.order("displacement_cc", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "year_desc":
      query = query.order("model_year", {
        ascending: false,
        nullsFirst: false,
      });
      break;
    case "mileage_asc":
      query = query.order("mileage_km", {
        ascending: true,
        nullsFirst: false,
      });
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
