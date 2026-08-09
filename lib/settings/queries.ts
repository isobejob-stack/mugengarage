import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ExternalLink, SiteSettingsValues } from "@/lib/settings/schema";

export type SiteSettings = {
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  business_hours: string | null;
  closed_days: string | null;
  founded_year: number | null;
  representative_name: string | null;
  access_info: string | null;
  line_url: string | null;
  external_links: ExternalLink[];
  // site-assets バケット内のオブジェクトパス。未設定なら文字ベースのヒーローにフォールバックする
  hero_image_path: string | null;
};

// マイグレーション適用前・設定未入力でも公開サイトが壊れないための既定値。
// すべて未設定として扱い、表示側では該当項目を出さない。
const EMPTY_SETTINGS: SiteSettings = {
  postal_code: null,
  address: null,
  phone: null,
  business_hours: null,
  closed_days: null,
  founded_year: null,
  representative_name: null,
  access_info: null,
  line_url: null,
  external_links: [],
  hero_image_path: null,
};

// 店舗設定は単一行（id = 'singleton'）で管理する。
//
// 公開サイトのフッター等、全ページから参照されるため、ここで例外を投げると
// サイト全体が落ちる。テーブル未作成（マイグレーション未適用）や一時的なDB障害でも
// 表示を継続できるよう、失敗時は空の設定として扱う。
// これは app/sitemap.ts で採った「補助的な情報のために全体を止めない」方針と同じ。
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", "singleton")
      .maybeSingle();

    if (error || !data) return EMPTY_SETTINGS;

    return {
      ...EMPTY_SETTINGS,
      ...data,
      // jsonbは任意の形が入りうるため、配列であることを確認してから渡す
      external_links: Array.isArray(data.external_links)
        ? (data.external_links as ExternalLink[])
        : [],
    };
  } catch {
    return EMPTY_SETTINGS;
  }
}

export async function updateSiteSettings(values: SiteSettingsValues) {
  const supabase = createAdminClient();

  return supabase
    .from("site_settings")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "singleton")
    .select("*")
    .single();
}
