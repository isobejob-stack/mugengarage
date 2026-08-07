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

// ISSUE-004課題1 / BR-DEL-002: 論理削除された整備実績の一覧（管理画面の「削除済み」タブ・復元用）
export async function listDeletedMaintenanceRecords() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("maintenance_records")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (data ?? []) as MaintenanceRecord[];
}

// ISSUE-004課題1 / BR-DEL-002: 復元対象の存在チェック用（論理削除済みのものだけを対象にする）
export async function getDeletedMaintenanceRecordById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle<MaintenanceRecord>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された整備実績の復元（deleted_atをnullに戻す）
export async function restoreMaintenanceRecord(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  return { data: data as MaintenanceRecord | null, error };
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
