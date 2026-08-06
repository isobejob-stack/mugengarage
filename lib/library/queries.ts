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
