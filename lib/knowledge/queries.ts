import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EncyclopediaEntry } from "@/lib/knowledge/types";

// FR-ENC-001: 管理画面の図鑑一覧（論理削除除く）
export async function listAdminEncyclopediaEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("id, category, title, slug, parent_id, display_order")
    .is("deleted_at", null)
    .order("category")
    .order("display_order");

  return (data ?? []) as EncyclopediaEntry[];
}

export async function getAdminEncyclopediaEntryById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<EncyclopediaEntry>();

  return data;
}

// FR-ENC-002: 公開図鑑一覧（BR-DOM-001: Vehicleに依存しない独立コンテンツ）
export async function listPublicEncyclopediaEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("id, category, title, slug")
    .is("deleted_at", null)
    .order("category")
    .order("display_order");

  return (data ?? []) as Array<
    Pick<EncyclopediaEntry, "id" | "category" | "title" | "slug">
  >;
}

export async function getPublicEncyclopediaEntryBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle<EncyclopediaEntry>();

  if (!data) return null;

  let parent: { title: string; slug: string } | null = null;
  if (data.parent_id) {
    const { data: parentData } = await supabase
      .from("encyclopedia_entries")
      .select("title, slug")
      .eq("id", data.parent_id)
      .maybeSingle();
    parent = parentData ?? null;
  }

  const { data: children } = await supabase
    .from("encyclopedia_entries")
    .select("id, title, slug")
    .eq("parent_id", data.id)
    .is("deleted_at", null)
    .order("display_order");

  return { entry: data, parent, children: children ?? [] };
}
