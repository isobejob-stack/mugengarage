import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// FR-INV-009 / system_architecture.md 4.4: 車両写真の保管先バケット。
// public: true のバケットとして作成している（supabase/migrations/20260806090000_...）ため、
// 表示側は署名なしの公開URL（getPublicUrl）をそのまま使える。
export const VEHICLE_PHOTOS_BUCKET = "vehicle-photos";

// アップロードされたファイル名の拡張子のみを取り出す。パストラバーサル等を避けるため、
// 元のファイル名はそのまま使わずランダムなオブジェクトキーを生成する。
function extractExtension(fileName: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(fileName);
  return match ? match[1].toLowerCase() : "jpg";
}

// 車両IDごとにディレクトリを分け、ファイル名はランダムなUUIDにする
export function buildVehiclePhotoStoragePath(
  vehicleId: string,
  originalFileName: string,
) {
  const extension = extractExtension(originalFileName);
  return `${vehicleId}/${crypto.randomUUID()}.${extension}`;
}

// storage_path から表示用の公開URLを組み立てる（署名不要、非公開バケットへの変更は行わない前提）
export function getVehiclePhotoPublicUrl(storagePath: string) {
  const supabase = createAdminClient();
  const { data } = supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
