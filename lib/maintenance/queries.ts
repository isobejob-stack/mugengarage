import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { MaintenanceRecord } from "@/lib/content/types";

// FR-MNT-001: 管理画面の整備実績一覧（論理削除除く）
export async function listAdminMaintenanceRecords() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("maintenance_records")
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (data ?? []) as MaintenanceRecord[];
}

export async function getAdminMaintenanceRecordById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<MaintenanceRecord>();

  return data;
}

// FR-MNT-003: 公開整備実績一覧
export async function listPublicMaintenanceRecords() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("maintenance_records")
    .select("id, title, slug, category, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (data ?? []) as Array<
    Pick<MaintenanceRecord, "id" | "title" | "slug" | "category" | "updated_at">
  >;
}

export async function getPublicMaintenanceRecordBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle<MaintenanceRecord>();

  return data;
}
