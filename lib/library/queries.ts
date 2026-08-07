import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LibraryEntry } from "@/lib/knowledge/types";

// FR-LIB-001: 管理画面のライブラリ一覧（論理削除除く）
export async function listAdminLibraryEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("library_entries")
    .select("*")
    .is("deleted_at", null)
    .order("title");

  return (data ?? []) as LibraryEntry[];
}

export async function getAdminLibraryEntryById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("library_entries")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<LibraryEntry>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除されたライブラリ項目の一覧（管理画面の「削除済み」タブ・復元用）
export async function listDeletedLibraryEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("library_entries")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (data ?? []) as LibraryEntry[];
}

// ISSUE-004課題1 / BR-DEL-002: 復元対象の存在チェック用（論理削除済みのものだけを対象にする）
export async function getDeletedLibraryEntryById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("library_entries")
    .select("*")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle<LibraryEntry>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除されたライブラリ項目の復元（deleted_atをnullに戻す）
export async function restoreLibraryEntry(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("library_entries")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  return { data: data as LibraryEntry | null, error };
}

// FR-LIB-003: 公開ライブラリ一覧（BR-DOM-002: 販売車両の有無に依存しない）
export async function listPublicLibraryEntries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("library_entries")
    .select("id, title, slug, reading_kana, category")
    .is("deleted_at", null)
    .order("reading_kana", { ascending: true, nullsFirst: false });

  return (data ?? []) as Array<
    Pick<LibraryEntry, "id" | "title" | "slug" | "reading_kana" | "category">
  >;
}

export async function getPublicLibraryEntryBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("library_entries")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle<LibraryEntry>();

  return data;
}
