import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OwnerArchiveEntry } from "@/lib/archive/types";

// FR-OWN-001: 車両が売約済になった際、削除せずアーカイブとして自動保持する（BR-DEL-003）
// 既存エントリがあれば何もしない（冪等）
export async function ensureOwnerArchiveEntry(vehicleId: string) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("owner_archive_entries")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (existing) return;

  await supabase
    .from("owner_archive_entries")
    .insert({ vehicle_id: vehicleId });
}

export async function getAdminOwnerArchiveEntry(vehicleId: string) {
  await ensureOwnerArchiveEntry(vehicleId);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("owner_archive_entries")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .maybeSingle<OwnerArchiveEntry>();

  return data;
}

// FR-OWN-003: 公開オーナーズアーカイブ一覧（公開設定済み・論理削除除く）
export async function listPublicOwnerArchiveEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("owner_archive_entries")
    .select(
      "vehicle_id, created_at, vehicles(model_year, manufacturers(name), models(name))",
    )
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as Array<{
    vehicle_id: string;
    created_at: string;
    vehicles: {
      model_year: number | null;
      manufacturers: { name: string } | null;
      models: { name: string } | null;
    } | null;
  }>;
}

export async function getPublicOwnerArchiveEntryByVehicleId(vehicleId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("owner_archive_entries")
    .select(
      "*, vehicles(model_year, price, engine, manufacturers(name), models(name))",
    )
    .eq("vehicle_id", vehicleId)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle();

  return data as
    | (OwnerArchiveEntry & {
        vehicles: {
          model_year: number | null;
          price: number;
          engine: string | null;
          manufacturers: { name: string } | null;
          models: { name: string } | null;
        } | null;
      })
    | null;
}
