import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SeoMeta, SeoTargetType, Redirect } from "@/lib/seo/types";

// FR-SEO-001 / FR-INV-011 / FR-BLOG-005 / FR-ENC-004:
// 対象コンテンツのSEOメタ情報を取得する（管理画面の編集フォーム初期値、公開ページのメタ生成の両方から使う）
export async function getSeoMeta(targetType: SeoTargetType, targetId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("seo_metas")
    .select("*")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle<SeoMeta>();

  return data;
}

// BR-URL-003: seo_metas.slug はコンテンツ種別（target_type）内でユニーク
// （テーブルのunique制約 (target_type, slug)。各種別のURLは/vehicles/, /blog/等の
// プレフィックスで完全に分離されているため、種別をまたいだ一意性は不要）。
// excludeTargetId には更新対象自身のtarget_idを渡し、自分自身とのバッティングを除外する。
export async function isSlugTakenInSeoMetas(
  targetType: SeoTargetType,
  slug: string,
  excludeTargetId?: string,
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("seo_metas")
    .select("id")
    .eq("target_type", targetType)
    .eq("slug", slug);
  if (excludeTargetId) {
    query = query.neq("target_id", excludeTargetId);
  }
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

// FR-SEO-003（必須修正5）: リダイレクト一覧取得（管理用）。
// BR-URL-002（Slug変更時は必ず301リダイレクトを設定する）が実際に守られているかを
// 運用者が確認できる手段が無かったため追加する。編集・削除機能は持たず、一覧表示のみ。
export async function listAdminRedirects() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("redirects")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Redirect[]>();

  return data ?? [];
}
