import type { Vehicle } from "@/lib/inventory/types";
import type { VehicleFormValues } from "@/lib/inventory/schema";
import type { RelatedContentTarget } from "@/lib/related/types";

// 日付・日時の列に空文字が入るのを防ぐ。
//
// Postgresの date / timestamptz 型に "" を渡すと
// `invalid input syntax for type date: ""` で書き込みが失敗する。
// zodは z.string().nullable() として "" を通してしまうため、検証は成功するのに
// 保存だけが失敗し、画面には原因の分からないエラーだけが出る形になっていた。
//
// 画面側でも空文字はnullに寄せているが（lib/utils/empty-to-null.ts）、
// APIは画面以外からも呼べるので、DBへ書く直前でも同じ保証を置く。
const DATE_LIKE_COLUMNS = ["shaken_expiry", "scheduled_publish_at"] as const;

export function sanitizeVehicleWriteValues<T extends Record<string, unknown>>(
  values: T,
): T {
  const next = { ...values };
  for (const column of DATE_LIKE_COLUMNS) {
    if (typeof next[column] === "string" && next[column].trim() === "") {
      (next as Record<string, unknown>)[column] = null;
    }
  }
  return next;
}

// DBの車両1件を、車両フォームの初期値に変換する。
//
// 編集画面と「コピーして新規登録」の2箇所で同じ変換が必要になったため共通化した。
// 60項目近くを画面側で1つずつ書き写していると、項目を足したときに片方だけ
// 直し忘れる（コピーしたのに一部の項目だけ空、という壊れ方をする）。

type FormExtras = {
  related: RelatedContentTarget[];
  tagIds: string[];
  slug?: string;
  seo?: VehicleFormValues["seo"];
};

export function toVehicleFormValues(
  vehicle: Vehicle,
  extras: FormExtras,
): VehicleFormValues {
  return {
    manufacturer_id: vehicle.manufacturer_id,
    model_id: vehicle.model_id,
    series_id: vehicle.series_id,
    generation_id: vehicle.generation_id,
    grade_id: vehicle.grade_id,
    status: vehicle.status,
    is_recommended: vehicle.is_recommended,
    is_new_arrival: vehicle.is_new_arrival,
    price: vehicle.price,
    total_price: vehicle.total_price,
    shaken_status: vehicle.shaken_status,
    legal_maintenance: vehicle.legal_maintenance,
    recycle_fee: vehicle.recycle_fee,
    steering_side: vehicle.steering_side,
    fuel_type: vehicle.fuel_type,
    capacity: vehicle.capacity,
    door_count: vehicle.door_count,
    has_record_book: vehicle.has_record_book,
    is_non_smoking: vehicle.is_non_smoking,
    model_code: vehicle.model_code,
    location_text: vehicle.location_text,
    engine: vehicle.engine,
    engine_model_code: vehicle.engine_model_code,
    displacement_cc: vehicle.displacement_cc,
    horsepower: vehicle.horsepower,
    torque: vehicle.torque,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    body_type: vehicle.body_type,
    model_year: vehicle.model_year,
    registration_year: vehicle.registration_year,
    mileage_km: vehicle.mileage_km,
    shaken_expiry: vehicle.shaken_expiry,
    owner_count: vehicle.owner_count,
    indoor_storage: vehicle.indoor_storage,
    accident_history: vehicle.accident_history,
    interior_color: vehicle.interior_color,
    exterior_color: vehicle.exterior_color,
    seat_material: vehicle.seat_material,
    vin: vehicle.vin,
    sales_comment: vehicle.sales_comment,
    manager_comment: vehicle.manager_comment,
    story: vehicle.story,
    sourcing_background: vehicle.sourcing_background,
    appeal_points: vehicle.appeal_points,
    engine_features: vehicle.engine_features,
    common_issues: vehicle.common_issues,
    maintenance_cost: vehicle.maintenance_cost,
    purchase_notes: vehicle.purchase_notes,
    recommended_points: vehicle.recommended_points,
    maintenance_details: vehicle.maintenance_details,
    custom_details: vehicle.custom_details,
    other_notes: vehicle.other_notes,
    scheduled_publish_at: vehicle.scheduled_publish_at,
    related: extras.related.map((r) => ({ type: r.type, id: r.id })),
    tags: extras.tagIds,
    slug: extras.slug,
    seo: extras.seo,
  };
}

// 既存車両をコピーして新規登録するときの初期値。
//
// 同じ車種の個体を続けて仕入れることが多く、諸元・説明文の大半が使い回せる一方、
// そのままコピーすると事故になる項目がある。落とすのは次の3種類。
//
// 1. その個体にしか紐づかない情報（VIN・車検満了日・走行距離）
//    VINは車1台に1つしかない番号で、コピーが残ったまま公開されると
//    別の車の車台番号を掲載することになる。
// 2. 公開に関わる状態（公開ステータス・おすすめ／新着・公開予約）
//    コピーした瞬間に未確認の車両が公開されることを防ぐため、必ず非公開から始める。
// 3. URL・SEO設定（呼び出し側で渡さない）
//    slugは車両ごとに一意で、コピーすると既存車両のURLと衝突する。
//
// 価格・写真の扱いは意図的に分けている。価格は「同じくらいの値付けから調整する」
// ことが多いのでコピーするが、写真は個体ごとに必ず違うためコピーしない
// （Storage上の同じファイルを2台で共有すると、片方を消したときにもう片方も消える）。
export function toCopiedVehicleFormValues(
  vehicle: Vehicle,
  extras: Omit<FormExtras, "slug" | "seo">,
): VehicleFormValues {
  return {
    ...toVehicleFormValues(vehicle, extras),
    status: "draft",
    is_recommended: false,
    is_new_arrival: false,
    scheduled_publish_at: null,
    vin: null,
    shaken_expiry: null,
    mileage_km: null,
    slug: undefined,
    seo: undefined,
  };
}
