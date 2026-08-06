import "server-only";

// vehiclesテーブル自体はslugを持たない（table_definitions.md 4.6）。
// 公開URL用のslugはseo_metas（target_type='vehicle'）に持たせる（BR-URL-003）。
// モデルのslug + 車両IDの先頭8桁で一意なslugを自動生成する。
export function buildVehicleSlug(modelSlug: string, vehicleId: string) {
  return `${modelSlug}-${vehicleId.slice(0, 8)}`;
}
