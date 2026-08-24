import "server-only";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache/tags";
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
async function fetchSiteSettings(): Promise<SiteSettings> {
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

// リクエストをまたいで持ち回るキャッシュ。
// 店舗情報は住所・電話番号・営業時間・LINE URLで、変わるのは年に数回。
// それを全ページ・全リクエストで読みに行くのは無駄が大きい。
//
// 管理画面から更新したときは revalidateSiteSettings() でこのタグを失効させるので、
// 保存した内容はその場で公開サイトに出る。revalidate は失効漏れがあっても
// いつかは追いつくようにするための保険で、通常はタグ側で先に切れる。
const getCachedSiteSettings = unstable_cache(
  fetchSiteSettings,
  ["site-settings"],
  { tags: [CACHE_TAGS.siteSettings], revalidate: 3600 },
);

// 1回の描画の中でも、ヘッダー・フッター・本文・generateMetadata から個別に呼ばれる。
// React の cache() でリクエスト内の重複呼び出しを1回に畳む
// （キャッシュヒット時でもデシリアライズのコストは掛かるため）。
export const getSiteSettings = cache(async (): Promise<SiteSettings> =>
  getCachedSiteSettings(),
);

// 店舗情報を書き換えた側（管理画面のAPI）から呼ぶ。
//
// expire: 0 は「古い値を一切出さずに次のリクエストで取り直す」指定。
// 既定の "max" は stale-while-revalidate（古い値を出しつつ裏で更新）になるため、
// 保存直後に公開サイトを開いた店主に一度は古い内容が見えてしまう。
// 店舗情報の更新頻度は低く、取り直しの負荷より「直したのに変わらない」を避ける方が大事。
export function revalidateSiteSettings() {
  revalidateTag(CACHE_TAGS.siteSettings, { expire: 0 });
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
