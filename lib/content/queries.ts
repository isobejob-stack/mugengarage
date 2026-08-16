import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Article } from "@/lib/content/types";

// FR-BLOG-001: 管理画面の記事一覧（下書き含む、論理削除除く）
export async function listAdminArticles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, status, category, published_at, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getAdminArticleById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<Article>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された記事の一覧（管理画面の「削除済み」タブ・復元用）
export async function listDeletedArticles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select(
      "id, title, slug, status, category, published_at, updated_at, deleted_at",
    )
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return data ?? [];
}

// ISSUE-004課題1 / BR-DEL-002: 復元対象の存在チェック用（論理削除済みのものだけを対象にする）
export async function getDeletedArticleById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle<Article>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された記事の復元（deleted_atをnullに戻す）
// 開発部長レビュー指摘（重大）: lib/inventory/queries.ts の restoreVehicle と同じ理由で、
// 削除前がpublishedだった記事は復元時にdraftへ落とす（誤操作での即時再公開を防ぐ）。
export async function restoreArticle(
  id: string,
  previousStatus: Article["status"],
) {
  const supabase = createAdminClient();
  const restoredStatus =
    previousStatus === "published" ? "draft" : previousStatus;

  const { data, error } = await supabase
    .from("articles")
    .update({ deleted_at: null, status: restoredStatus })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  return { data: data as Article | null, error, restoredStatus };
}

// 公開記事一覧（新着順）
//
// 以前は pagination.md の「ブログ記事一覧デフォルト10件」に合わせて limit(10) を掛けていたが、
// カテゴリchipの件数と総件数を出すには、絞り込み前の全件を数える必要がある。
// 10件で切ると「整備記録（3）」と出しながら11件目以降を数えられず、件数が嘘になる。
// 記事は整備実績を統合しても10件前後で、1回の取得で全件読んでも負荷にならない。
// 数十件規模まで増えたら components/ui/pagination.tsx を挟む（件数集計は別クエリに分ける）。
//
// published_at が null の公開記事（旧データ）を末尾に落とすため nullsFirst: false を指定する。
export async function listPublicArticles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, category, published_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false, nullsFirst: false });

  return data ?? [];
}

export async function getPublicArticleBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle<Article>();

  return data;
}
