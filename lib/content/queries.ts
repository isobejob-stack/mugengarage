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

// 公開記事一覧（新着順、pagination.md: ブログ記事一覧デフォルト10件）
export async function listPublicArticles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, slug, category, published_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(10);

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
