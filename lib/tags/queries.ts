import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tag, TaggableType } from "@/lib/seo/types";

// FR-INV-012 / FR-BLOG-002 / BR-DATA-003: タグマスタ一覧（名前順）
export async function listTags() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tags")
    .select("*")
    .order("name")
    .returns<Tag[]>();

  return data ?? [];
}

export async function getTagById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tags")
    .select("*")
    .eq("id", id)
    .maybeSingle<Tag>();

  return data;
}

// FR-INV-012 / FR-BLOG-002 / BR-DATA-003:
// タグの新規作成。name/slugの重複はtagsテーブルのUNIQUE制約で防ぐ（呼び出し側でerror.code==="23505"を判定する）
export async function createTag(values: { name: string; slug: string }) {
  const supabase = createAdminClient();
  return supabase.from("tags").insert(values).select().single<Tag>();
}

// タグ削除。
// tagsテーブルはdeleted_atカラムを持たない設計（supabase/migrations/20260805092300_create_tags_table.sql）。
// BR-DEL-001が対象とするのは車両・記事等の「主要データ」であり、tags/taggingsのような
// 分類マスタ・ポリモーフィックな中間テーブルはその対象に含まれない
// （lib/related/queries.tsのreplaceRelatedContentsと同様、中間テーブルは物理的な削除・再作成を前提とした設計）。
// taggings.tag_id は tags(id) への FK（ON DELETE指定なし=RESTRICT）のため、
// 先に紐付け（taggings）を削除してからタグ本体を削除する。
export async function deleteTag(id: string) {
  const supabase = createAdminClient();
  await supabase.from("taggings").delete().eq("tag_id", id);
  return supabase.from("tags").delete().eq("id", id).select().maybeSingle<Tag>();
}

// 特定コンテンツ（車両・記事）に紐付いたタグ一覧を取得する
// （管理画面の編集フォーム初期値、公開ページのタグ表示に使用）
export async function listTagsForTaggable(
  taggableType: TaggableType,
  taggableId: string,
) {
  const supabase = createAdminClient();
  const { data: taggings } = await supabase
    .from("taggings")
    .select("tag_id")
    .eq("taggable_type", taggableType)
    .eq("taggable_id", taggableId);

  const tagIds = (taggings ?? []).map((t) => t.tag_id);
  if (tagIds.length === 0) return [];

  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .in("id", tagIds)
    .order("name")
    .returns<Tag[]>();

  return tags ?? [];
}

// FR-SRCH-001: 指定タグが付与されたコンテンツのIDを取得する（検索の絞り込み用）
export async function listTaggableIdsByTag(
  taggableType: TaggableType,
  tagId: string,
) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("taggings")
    .select("taggable_id")
    .eq("taggable_type", taggableType)
    .eq("tag_id", tagId);

  return (data ?? []).map((t) => t.taggable_id as string);
}

// FR-INV-012 / FR-BLOG-002: タグ紐付けを全置換する（保存のたびに削除→再挿入）。
// lib/related/queries.tsのreplaceRelatedContentsと同じ「全置換」パターン。
// taggings.tag_idはtags(id)へのFK（ON DELETE指定なし=RESTRICT）を持つため、
// 挿入時にタグが削除済み等で失敗しうる。呼び出し側で結果を確認できるよう、
// エラーを握りつぶさずerrorを返す（本体保存は成功したのにタグだけ消える事故を防ぐ）。
export async function replaceTaggings(
  taggableType: TaggableType,
  taggableId: string,
  tagIds: string[],
) {
  const supabase = createAdminClient();
  const { error: deleteError } = await supabase
    .from("taggings")
    .delete()
    .eq("taggable_type", taggableType)
    .eq("taggable_id", taggableId);

  if (deleteError) return { error: deleteError };
  if (tagIds.length === 0) return { error: null };

  const { error: insertError } = await supabase.from("taggings").insert(
    tagIds.map((tagId) => ({
      tag_id: tagId,
      taggable_type: taggableType,
      taggable_id: taggableId,
    })),
  );

  return { error: insertError };
}
