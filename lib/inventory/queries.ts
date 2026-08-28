import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import type { SeoMeta } from "@/lib/seo/types";
import type {
  Manufacturer,
  Model,
  Series,
  Generation,
  Grade,
  GradeTemplate,
  Vehicle,
  VehiclePhoto,
  VehicleVideo,
} from "@/lib/inventory/types";

// 車両階層マスタ一覧（管理画面フォームのセレクト用）。BR-DATA-003によりハードコードしない。
export async function getVehicleHierarchyOptions() {
  const supabase = createAdminClient();

  const [manufacturers, models, series, generations, grades, gradeTemplates] =
    await Promise.all([
      supabase
        .from("manufacturers")
        .select("*")
        .is("deleted_at", null)
        .order("name")
        .returns<Manufacturer[]>(),
      supabase
        .from("models")
        .select("*")
        .is("deleted_at", null)
        .order("name")
        .returns<Model[]>(),
      supabase
        .from("series")
        .select("*")
        .is("deleted_at", null)
        .order("name")
        .returns<Series[]>(),
      supabase
        .from("generations")
        .select("*")
        .is("deleted_at", null)
        .order("name")
        .returns<Generation[]>(),
      supabase
        .from("grades")
        .select("*")
        .is("deleted_at", null)
        .order("name")
        .returns<Grade[]>(),
      supabase.from("grade_templates").select("*").returns<GradeTemplate[]>(),
    ]);

  return {
    manufacturers: manufacturers.data ?? [],
    models: models.data ?? [],
    series: series.data ?? [],
    generations: generations.data ?? [],
    grades: grades.data ?? [],
    gradeTemplates: gradeTemplates.data ?? [],
  };
}

// FR-INV-001 / BR-DATA-003:
// メーカーの新規作成（車両登録フォームの「その他（手入力）」から呼ばれる）。
// name/slugの重複はmanufacturersテーブルのUNIQUE制約で防ぐ（呼び出し側でerror.code==="23505"を判定する）
export async function createManufacturer(values: {
  name: string;
  slug: string;
}) {
  const supabase = createAdminClient();
  return supabase
    .from("manufacturers")
    .insert(values)
    .select()
    .single<Manufacturer>();
}

// FR-INV-001 / BR-DATA-003:
// 車種の新規作成（同上）。models.slugはメーカーをまたいでテーブル全体でUNIQUE制約を持つ点に注意
// （table_definitions.md 4.2 / supabase/migrations/20260805090300_create_models_table.sql）。
export async function createModel(values: {
  manufacturer_id: string;
  name: string;
  slug: string;
}) {
  const supabase = createAdminClient();
  return supabase.from("models").insert(values).select().single<Model>();
}

// FR-INV-002: 管理画面の車両一覧（全ステータス、論理削除除く）
export type AdminVehicleListItem = {
  id: string;
  status: string;
  price: number;
  model_year: number | null;
  mileage_km: number | null;
  display_order: number;
  updated_at: string;
  manufacturers: { name: string } | null;
  models: { name: string } | null;
  grades: { name: string } | null;
  photoCount: number;
  /** 一覧に出す1枚目のサムネイル。写真が無ければ null */
  leadPhotoUrl: string | null;
};

// 管理画面の車両一覧。
//
// 写真とグレードまで持ってくるのは、この店の在庫が
// 「ジャガー XJ」だけで10台あるため（supabase/setup.sql）。
// 車名と年式だけを並べると、ほぼ同じ行が10行続いて目的の1台を選べない。
// 写真・グレード・走行距離は、その中から1台を見分けるための手がかりとして出す。
//
// 写真は台数ぶんの問い合わせにせず、1回で全件読んでから車両ごとに振り分ける
// （在庫は数十台、写真も数百枚の規模なので、まとめて読むほうが速い）。
export async function listAdminVehicles(): Promise<AdminVehicleListItem[]> {
  const supabase = createAdminClient();

  const [vehicles, photos] = await Promise.all([
    supabase
      .from("vehicles")
      .select(
        "id, status, price, model_year, mileage_km, display_order, updated_at, manufacturers(name), models(name), grades(name)",
      )
      .is("deleted_at", null)
      .order("display_order", { ascending: true }),
    supabase
      .from("vehicle_photos")
      .select("vehicle_id, storage_path, display_order")
      .order("display_order", { ascending: true }),
  ]);

  const photoPathsByVehicle = new Map<string, string[]>();
  for (const row of (photos.data ?? []) as Array<{
    vehicle_id: string;
    storage_path: string;
  }>) {
    const list = photoPathsByVehicle.get(row.vehicle_id) ?? [];
    list.push(row.storage_path);
    photoPathsByVehicle.set(row.vehicle_id, list);
  }

  const rows = (vehicles.data ?? []) as unknown as Array<
    Omit<AdminVehicleListItem, "photoCount" | "leadPhotoUrl">
  >;

  return rows.map((vehicle) => {
    const paths = photoPathsByVehicle.get(vehicle.id) ?? [];
    return {
      ...vehicle,
      photoCount: paths.length,
      leadPhotoUrl: paths[0] ? getVehiclePhotoPublicUrl(paths[0]) : null,
    };
  });
}

export async function getAdminVehicleById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<Vehicle>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された車両の一覧（管理画面の「削除済み」タブ・復元用）
export async function listDeletedVehicles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, status, price, model_year, display_order, updated_at, deleted_at, manufacturers(name), models(name)",
    )
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    price: number;
    model_year: number | null;
    display_order: number;
    updated_at: string;
    deleted_at: string;
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  }>;
}

// ISSUE-004課題1 / BR-DEL-002: 復元対象の存在チェック用（論理削除済みのものだけを対象にする）
export async function getDeletedVehicleById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle<Vehicle>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された車両の復元（deleted_atをnullに戻す）。
// 開発部長レビュー指摘（重大）: 削除前のstatusをそのまま復元すると、削除前がpublished
// （公開中）だった場合に確認なしで即座に再公開されてしまう。03_ui_rules.md 7章は公開
// ステータス変更を「取り消しにくい操作」として慎重に扱うことを求めており、価格変更ですら
// ConfirmDialogを挟んでいる水準に対して、これは安全策が不足していた。
// そのため、削除前がpublishedだった車両は復元時にdraft（非公開）へ落とし、運用者が内容を
// 再確認してから改めて公開操作を行う運用とする。それ以外のstatus（draft/negotiating/
// coming_soon。soldはBR-DEL-003によりそもそも削除不可）はそのまま維持する。
export async function restoreVehicle(
  id: string,
  previousStatus: Vehicle["status"],
) {
  const supabase = createAdminClient();
  const restoredStatus =
    previousStatus === "published" ? "draft" : previousStatus;

  const { data, error } = await supabase
    .from("vehicles")
    .update({ deleted_at: null, status: restoredStatus })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  return { data: data as Vehicle | null, error, restoredStatus };
}

// 公開サイトの一覧カードが必要とする車両の形。
// トップページ・在庫一覧・お気に入りで同じカードを使うため、選ぶ列も揃えている。
type PublicVehicleListItem = {
  id: string;
  price: number;
  total_price: number | null;
  model_year: number | null;
  mileage_km: number | null;
  shaken_status: string | null;
  shaken_expiry: string | null;
  accident_history: boolean | null;
  status: string;
  is_recommended: boolean;
  is_new_arrival: boolean;
  manufacturers: { name: string } | null;
  models: { name: string } | null;
  grades: { name: string } | null;
};

// 車両詳細のURLに使うslugは seo_metas 側にあるため、一覧の行に後から結合する。
// 対象の車両ぶんだけを1クエリでまとめて引く（車両ごとに引くとN+1になる）。
//
// export しているのは、呼び出し側で「slugの取得」と「写真の取得」を
// 同時に走らせるため。どちらも必要なのは車両IDだけなので、順番に待つ理由がない。
// 中で await して繋げてしまうと、往復時間が素直に足し算になる。
export async function attachVehicleSlugs<T extends { id: string }>(
  vehicles: T[],
): Promise<Array<T & { slug: string | null }>> {
  if (vehicles.length === 0) return [];
  return withSlugs(createAdminClient(), vehicles);
}

async function withSlugs<T extends { id: string }>(
  supabase: ReturnType<typeof createAdminClient>,
  vehicles: T[],
): Promise<Array<T & { slug: string | null }>> {
  const { data: seoMetas } = await supabase
    .from("seo_metas")
    .select("target_id, slug")
    .eq("target_type", "vehicle")
    .in(
      "target_id",
      vehicles.map((v) => v.id),
    );

  const slugByVehicleId = new Map(
    (seoMetas ?? []).map((s) => [s.target_id, s.slug as string]),
  );

  return vehicles.map((v) => ({
    ...v,
    slug: slugByVehicleId.get(v.id) ?? null,
  }));
}

// FR-SRCH-002: 公開中車両の一覧（status=published かつ論理削除されていないもの）
export async function listPublicVehicles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, status, is_recommended, is_new_arrival, manufacturers(name), models(name), grades(name)",
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  const vehicles = (data ?? []) as unknown as PublicVehicleListItem[];

  if (vehicles.length === 0) return [];

  return withSlugs(supabase, vehicles);
}

// トップページ用: 先頭数台と総台数だけを取る。
//
// 以前はここでも listPublicVehicles() を使い、公開中の車両を全件読んでから
// 先頭9台にスライスしていた。表示に使わない車両の諸元・車名・slug（seo_metas）まで
// 毎リクエスト運んでいたことになる。台数表示（「すべて見る（N台）」・検索ブロック）に
// 必要なのは件数だけなので、件数はDBに数えさせ、行は必要なぶんだけ受け取る。
export async function listPublicVehiclePreview(limit: number) {
  const supabase = createAdminClient();
  const { data, count } = await supabase
    .from("vehicles")
    .select(
      "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, status, is_recommended, is_new_arrival, manufacturers(name), models(name), grades(name)",
      { count: "exact" },
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .range(0, Math.max(limit - 1, 0));

  const vehicles = (data ?? []) as unknown as PublicVehicleListItem[];

  // slugはここで結合しない。呼び出し側が写真の取得と同時に走らせられるよう、
  // 車両IDが分かった時点でいったん返す（attachVehicleSlugs を使う）。
  return { vehicles, totalCount: count ?? vehicles.length };
}

// /jaguar 用: 在庫がどの車種・どの年式に集まっているかだけを取る。
//
// あのページが在庫から使うのは「車種名」と「年式」の2つだけで、
// 価格や車検の状態、slugは一切使っていない。全件を全列で読む理由がない
// （slugを引くための seo_metas への2本目のクエリも不要になる）。
export async function getPublicVehicleStockSummary() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select("model_year, models(name)")
    .eq("status", "published")
    .is("deleted_at", null);

  return (data ?? []) as unknown as Array<{
    model_year: number | null;
    models: { name: string } | null;
  }>;
}

// 車両詳細ページの本体。
//
// React の cache() で1リクエスト内の重複呼び出しを1回に畳む。
// このページは generateMetadata（タイトル・OGP用）と本文描画の両方が同じslugを引くため、
// 素のままだと「slugから車両IDを引く」「その車両を読む」の2クエリが1ページで2度ずつ、
// 計4回走っていた。しかも2つは直列なので、往復時間もそのまま2倍になっていた。
export const getPublicVehicleBySlug = cache(async (slug: string) => {
  const supabase = createAdminClient();
  // 列を絞らず全部取る。この行はslugから車両IDを引くためだけでなく、
  // ページのタイトル・説明・OGP・canonical（SEOメタ）そのものでもある。
  // target_id だけを取ると、同じ行をあとで getSeoMeta で引き直すことになり、
  // 往復が1つ増える（しかも車両の取得が終わるまで始められない直列の1段になる）。
  const { data: seoMeta } = await supabase
    .from("seo_metas")
    .select("*")
    .eq("target_type", "vehicle")
    .eq("slug", slug)
    .maybeSingle<SeoMeta>();

  if (!seoMeta) return null;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, manufacturers(name), models(name)")
    .eq("id", seoMeta.target_id)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (!vehicle) return null;

  return {
    vehicle: vehicle as Vehicle & {
      manufacturers: { name: string } | null;
      models: { name: string } | null;
    },
    seoMeta,
  };
});

// FR-INV-009: 車両写真一覧（論理削除除く、表示順）。table_definitions.md 4.8
export async function getVehiclePhotos(vehicleId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<VehiclePhoto[]>();

  return data ?? [];
}

// 一覧表示用: 複数車両の先頭写真（storage_path）のみを1クエリでまとめて取得する
// （車両ごとにgetVehiclePhotosを呼ぶN+1クエリを避けるため。レビュー指摘対応）
export async function getLeadVehiclePhotoPaths(vehicleIds: string[]) {
  if (vehicleIds.length === 0) return new Map<string, string>();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicle_photos")
    .select("vehicle_id, storage_path, display_order")
    .in("vehicle_id", vehicleIds)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<
      Pick<VehiclePhoto, "vehicle_id" | "storage_path" | "display_order">[]
    >();

  const result = new Map<string, string>();
  for (const row of data ?? []) {
    if (!result.has(row.vehicle_id)) {
      result.set(row.vehicle_id, row.storage_path);
    }
  }
  return result;
}

// 一覧カードで数枚めくれるようにするため、車両ごとに先頭から数枚を取る（N+1クエリ回避）。
//
// 中古車探しは「気になった車の写真を何枚か見て、詳細に入るか決める」という進み方をする。
// 1枚しか出せないと、その判断のたびに詳細ページへの往復が発生していた。
export async function getVehiclePhotoPathsByVehicle(
  vehicleIds: string[],
  perVehicle = 5,
) {
  if (vehicleIds.length === 0) return new Map<string, string[]>();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicle_photos")
    .select("vehicle_id, storage_path, display_order")
    .in("vehicle_id", vehicleIds)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<
      Pick<VehiclePhoto, "vehicle_id" | "storage_path" | "display_order">[]
    >();

  const result = new Map<string, string[]>();
  for (const row of data ?? []) {
    const list = result.get(row.vehicle_id) ?? [];
    if (list.length < perVehicle) {
      list.push(row.storage_path);
      result.set(row.vehicle_id, list);
    }
  }
  return result;
}

// FR-INV-010: 車両動画一覧（表示順）。table_definitions.md 4.9
export async function getVehicleVideos(vehicleId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicle_videos")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("display_order", { ascending: true })
    .returns<VehicleVideo[]>();

  return data ?? [];
}
