import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import {
  VEHICLE_PHOTO_SUMMARY_SELECT,
  toVehiclePhotoSummary,
  withVehiclePhotoSummary,
  type VehiclePhotoSummaryColumns,
} from "@/lib/inventory/queries";

// FR-ADM-003: メディア管理。
//
// 「アップロード済みのファイルを一覧する」画面としては作らない。
// この店で実際に困っているのは「どのファイルがあるか」ではなく
// **「どの車両に写真が無いか」**であり、2026-08-17時点で在庫21台に対して
// 登録済みの写真は1枚しかない。中古車サイトとして最大の弱点がここにある。
//
// そこで、写真の登録状況を車両単位で出し、0枚の車両を先頭に並べる画面にする。
// 一覧を見た人が次に取る行動（写真を足す）へ最短で進める形を優先する。

export type VehicleMediaStatus = {
  id: string;
  name: string;
  status: string;
  photoCount: number;
  videoCount: number;
  /** 先頭1枚のサムネイル。0枚のときはnull */
  leadPhotoUrl: string | null;
};

export async function listVehicleMediaStatus(): Promise<VehicleMediaStatus[]> {
  const supabase = createAdminClient();

  // 写真は車両の行に「先頭1枚」と「枚数」を埋め込んで読む。写真の行を全件読むと、
  // 1,000枚を超えたところで読み込みの上限に切り捨てられ、枚数が少なく出ていた。
  const [vehicles, videos] = await Promise.all([
    withVehiclePhotoSummary(
      supabase
        .from("vehicles")
        .select(
          `id, status, display_order, manufacturers(name), models(name), ${VEHICLE_PHOTO_SUMMARY_SELECT}`,
        )
        .is("deleted_at", null)
        .order("display_order"),
      1,
    ),
    supabase.from("vehicle_videos").select("vehicle_id"),
  ]);

  const videoCountByVehicle = new Map<string, number>();
  for (const row of (videos.data ?? []) as Array<{ vehicle_id: string }>) {
    videoCountByVehicle.set(
      row.vehicle_id,
      (videoCountByVehicle.get(row.vehicle_id) ?? 0) + 1,
    );
  }

  const rows = (
    (vehicles.data ?? []) as unknown as Array<
      {
        id: string;
        status: string;
        manufacturers: { name: string } | null;
        models: { name: string } | null;
      } & VehiclePhotoSummaryColumns
    >
  ).map((vehicle) => {
    const summary = toVehiclePhotoSummary(vehicle);
    return {
      id: vehicle.id,
      name:
        [vehicle.manufacturers?.name, vehicle.models?.name]
          .filter(Boolean)
          .join(" ") || "（車種未設定）",
      status: vehicle.status,
      photoCount: summary.total,
      videoCount: videoCountByVehicle.get(vehicle.id) ?? 0,
      leadPhotoUrl: summary.paths[0]
        ? getVehiclePhotoPublicUrl(summary.paths[0])
        : null,
    };
  });

  // 写真が無い車両を先頭に、そのうち公開中のものを最優先で出す。
  // 公開中なのに写真が無い＝いま実際にお客様が見て落胆している画面、という順序。
  const priority = (row: VehicleMediaStatus) => {
    if (row.photoCount === 0 && row.status === "published") return 0;
    if (row.photoCount === 0) return 1;
    return 2;
  };

  return rows.sort(
    (a, b) => priority(a) - priority(b) || a.photoCount - b.photoCount,
  );
}
