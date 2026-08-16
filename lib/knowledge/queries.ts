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

// ISSUE-004課題1 / BR-DEL-002: 論理削除された図鑑項目の一覧（管理画面の「削除済み」タブ・復元用）
export async function listDeletedEncyclopediaEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("id, category, title, slug, parent_id, display_order, deleted_at")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (data ?? []) as Array<
    Pick<
      EncyclopediaEntry,
      "id" | "category" | "title" | "slug" | "parent_id" | "display_order"
    > & { deleted_at: string }
  >;
}

// ISSUE-004課題1 / BR-DEL-002: 復元対象の存在チェック用（論理削除済みのものだけを対象にする）
export async function getDeletedEncyclopediaEntryById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("*")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle<EncyclopediaEntry>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された図鑑項目の復元（deleted_atをnullに戻す）。
// BR-DOM-001〜003: 図鑑項目はVehicleへの直接外部キーを持たないため、復元によって
// Vehicle側の整合性を気にする必要はない。親項目（parent_id）が削除済みのままでも、
// 子項目単体の復元は妨げない（親の復元は運用者の別操作に委ねる。既存のDELETEも
// 子への論理削除カスケードを行っていないため、対称的にRESTOREも単体操作とする）。
export async function restoreEncyclopediaEntry(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("encyclopedia_entries")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  return { data: data as EncyclopediaEntry | null, error };
}

// FR-ENC-002: 公開図鑑一覧（BR-DOM-001: Vehicleに依存しない独立コンテンツ）
export async function listPublicEncyclopediaEntries() {
  const supabase = createAdminClient();
  // body も取る。一覧をタイトルだけのカードにすると、36件のうちどれが
  // 読む価値のある解説で、どれが型式の区分なのかが開くまで分からない。
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("id, category, title, slug, body")
    .is("deleted_at", null)
    .order("category")
    .order("display_order");

  return (data ?? []) as Array<
    Pick<EncyclopediaEntry, "id" | "category" | "title" | "slug" | "body">
  >;
}

// FR-ENC-002: /jaguar（1枚の読み物）で引用するための図鑑本文。
//
// 読み物が引用するのはブランド編・車種・エンジンだけなので、種別で絞って取る。
// listPublicEncyclopediaEntries は37件すべての本文（合計約37,000字）を返すため、
// そのまま使うと、画面に一切出ないシリーズ20件の本文まで毎リクエスト運ぶことになる。
//
// 並びは display_order。どの車種を読み物の代表として出すかは、
// 管理画面の並び替えだけで運用者が変えられる状態にしておく（コードの修正を挟まない）。
export async function listPublicEncyclopediaEntriesForReading() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("encyclopedia_entries")
    .select("id, category, title, slug, body")
    .is("deleted_at", null)
    .in("category", ["brand", "model", "engine"])
    .order("display_order");

  return (data ?? []) as Array<
    Pick<EncyclopediaEntry, "id" | "category" | "title" | "slug" | "body">
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
      .is("deleted_at", null)
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
