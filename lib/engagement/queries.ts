import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// FR-FAV-001: 現在のセッションがお気に入り登録済みの車両ID一覧
export async function listFavoriteVehicleIds(sessionId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("favorites")
    .select("vehicle_id")
    .eq("session_id", sessionId);

  return (data ?? []).map((f) => f.vehicle_id);
}

// FR-FAV-001: お気に入りの登録／解除をトグルする（一意制約 vehicle_id+session_id を利用）
export async function toggleFavorite(sessionId: string, vehicleId: string) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
    return false;
  }

  await supabase
    .from("favorites")
    .insert({ vehicle_id: vehicleId, session_id: sessionId });
  return true;
}

// FR-FAV-002: お気に入り一覧（公開中の車両のみ、BR-DATA-002によりVehicle情報はコピーせず都度参照）
export async function getPublicFavoriteVehicles(sessionId: string) {
  const supabase = createAdminClient();
  const vehicleIds = await listFavoriteVehicleIds(sessionId);
  if (vehicleIds.length === 0) return [];

  // お気に入り一覧は複数台を並べて見比べる画面のため、
  // 車両一覧のカードと同じ情報（支払総額・年式・走行距離・車検・修復歴）を出せるようにする。
  // 以前は本体価格しか取っておらず、一覧では支払総額・お気に入りでは本体価格という
  // 「同じ見た目で違う意味の数字」が並んでいた（価格の誤認につながる）。
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, status, manufacturers(name), models(name), grades(name)",
    )
    .in("id", vehicleIds)
    .eq("status", "published")
    .is("deleted_at", null);

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
    manufacturers: { name: string } | null;
    models: { name: string } | null;
    grades: { name: string } | null;
  }>;
  if (vehicles.length === 0) return [];

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

  return vehicles.map((v) => ({
    ...v,
    slug: slugByVehicleId.get(v.id) ?? null,
  }));
}

// FR-CRM-005: 顧客IDに紐づくお気に入り一覧（vehicle_idとcreated_at）。
// favoritesはEngagement Contextの所有データのため、他コンテキストからの
// 読み取りもこの関数を通してのみ行う（bounded_context.md）。
export async function getFavoritesByCustomerId(customerId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("favorites")
    .select("vehicle_id, created_at")
    .eq("customer_id", customerId);

  return (data ?? []) as Array<{ vehicle_id: string; created_at: string }>;
}

// FR-FAV-004: お気に入り数を基にした人気ランキング（公開中の車両のみ）
export async function getVehicleFavoriteRanking(limit = 10) {
  const supabase = createAdminClient();
  const { data: favorites } = await supabase
    .from("favorites")
    .select("vehicle_id");

  if (!favorites || favorites.length === 0) return [];

  const countByVehicleId = new Map<string, number>();
  for (const f of favorites) {
    countByVehicleId.set(
      f.vehicle_id,
      (countByVehicleId.get(f.vehicle_id) ?? 0) + 1,
    );
  }

  const vehicleIds = Array.from(countByVehicleId.keys());
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, price, model_year, mileage_km, status, manufacturers(name), models(name)",
    )
    .in("id", vehicleIds)
    .eq("status", "published")
    .is("deleted_at", null);

  const vehicles = (data ?? []) as unknown as Array<{
    id: string;
    price: number;
    model_year: number | null;
    mileage_km: number | null;
    status: string;
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  }>;
  if (vehicles.length === 0) return [];

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

  return vehicles
    .map((v) => ({
      ...v,
      slug: slugByVehicleId.get(v.id) ?? null,
      favoriteCount: countByVehicleId.get(v.id) ?? 0,
    }))
    .sort((a, b) => b.favoriteCount - a.favoriteCount)
    .slice(0, limit);
}

// FR-CRM-005: 顧客が確定したタイミングで、同じ匿名セッションのfavoritesに
// customer_idを紐付ける（event_flow.md 3.4 #3）。favoritesはEngagement Contextの
// 所有データのため、更新はこの関数を通してのみ行う（bounded_context.md）。
// 既に別のcustomer_idが紐づいている行は上書きしない（同一端末を複数人が
// 使い回すケースで前の顧客の紐付けを消さないため）。
export async function linkFavoritesToCustomer(
  sessionId: string,
  customerId: string,
) {
  const supabase = createAdminClient();
  return supabase
    .from("favorites")
    .update({ customer_id: customerId })
    .eq("session_id", sessionId)
    .is("customer_id", null);
}

// FR-FAV-003: 管理画面向けのお気に入り登録数集計（全ステータス対象）
export async function getAdminFavoriteCounts(limit = 20) {
  const supabase = createAdminClient();
  const { data: favorites } = await supabase
    .from("favorites")
    .select("vehicle_id");

  if (!favorites || favorites.length === 0) return [];

  const countByVehicleId = new Map<string, number>();
  for (const f of favorites) {
    countByVehicleId.set(
      f.vehicle_id,
      (countByVehicleId.get(f.vehicle_id) ?? 0) + 1,
    );
  }

  const vehicleIds = Array.from(countByVehicleId.keys());
  const { data } = await supabase
    .from("vehicles")
    .select("id, status, model_year, manufacturers(name), models(name)")
    .in("id", vehicleIds)
    .is("deleted_at", null);

  const vehicles = (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    model_year: number | null;
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  }>;

  return vehicles
    .map((v) => ({ ...v, favoriteCount: countByVehicleId.get(v.id) ?? 0 }))
    .sort((a, b) => b.favoriteCount - a.favoriteCount)
    .slice(0, limit);
}
