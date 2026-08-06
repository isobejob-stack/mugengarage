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

// FR-SRCH-002: 公開中車両の一覧（status=published かつ論理削除されていないもの）
export async function listPublicVehicles() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("vehicles")
    .select(
      "id, price, model_year, mileage_km, status, manufacturers(name), models(name)",
    )
    .eq("status", "published")
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  const vehicles = (data ?? []) as unknown as Array<{
    id: string;
    price: number;
    model_year: number | null;
    mileage_km: number | null;
    status: string;
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
