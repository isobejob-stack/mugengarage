import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// 店舗写真など、特定の車両に紐づかないサイト素材の保管先。
// public バケットのため、表示側は署名なしの公開URLをそのまま使える
// （supabase/migrations/20260808160000_create_site_assets_bucket.sql）。
export const SITE_ASSETS_BUCKET = "site-assets";

// 車両写真と同じ上限に揃える。スマートフォンで撮った写真をそのまま上げても収まる大きさ。
export const MAX_SITE_ASSET_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// アップロードされたファイル名はそのまま使わず拡張子だけを取り出す
// （パストラバーサルや日本語ファイル名による事故を避けるため。lib/inventory/storage.ts と同方針）
function extractExtension(fileName: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : "jpg";
}

export function buildSiteAssetStoragePath(
  prefix: string,
  originalFileName: string,
) {
  const extension = extractExtension(originalFileName);
  return `${prefix}/${crypto.randomUUID()}.${extension}`;
}

export function getSiteAssetPublicUrl(storagePath: string) {
  const supabase = createAdminClient();
  const { data } = supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
