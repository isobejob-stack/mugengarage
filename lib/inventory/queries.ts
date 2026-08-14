import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
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
export async function listAdminVehicles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, status, price, model_year, display_order, updated_at, manufacturers(name), models(name)",
    )
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  return (data ?? []) as unknown as Array<{
    id: string;
    status: string;
    price: number;
    model_year: number | null;
    display_order: number;
    updated_at: string;
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  }>;
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

// FR-SRCH-002: 公開中車両の一覧（status=published かつ論理削除されていないもの）
export async function listPublicVehicles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, status, is_recommended, is_new_arrival, manufacturers(name), models(name)",
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  const vehicles = (data ?? []) as unknown as Array<{
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
  }>;

  if (vehicles.length === 0) return [];

  const { data: seoMetas } = await supabase
    .from("seo_metas")
    .select("target_id, slug")
    .eq("target_type", "vehicle")
    .in(
      "target_id",
      vehicles.map((v) => v.id),
    );

  const slugByVehicleId = new Map(
    (seoMetas ?? []).map((s) => [s.target_id, s.slug]),
  );

  return vehicles.map((v) => ({
    ...v,
    slug: slugByVehicleId.get(v.id) ?? null,
  }));
}

export async function getPublicVehicleBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data: seoMeta } = await supabase
    .from("seo_metas")
    .select("target_id")
    .eq("target_type", "vehicle")
    .eq("slug", slug)
    .maybeSingle();

  if (!seoMeta) return null;

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, manufacturers(name), models(name)")
    .eq("id", seoMeta.target_id)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  return vehicle as
    | (Vehicle & {
        manufacturers: { name: string } | null;
        models: { name: string } | null;
      })
    | null;
}

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
