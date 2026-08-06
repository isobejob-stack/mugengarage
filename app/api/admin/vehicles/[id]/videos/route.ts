import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { vehicleVideoFormSchema } from "@/lib/inventory/schema";
import { getAdminVehicleById, getVehicleVideos } from "@/lib/inventory/queries";

// FR-INV-010: 車両動画一覧取得（管理用、編集フォームの初期値）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const vehicle = await getAdminVehicleById(id);
  if (!vehicle) {
    return apiError({ code: "NOT_FOUND", message: "車両が見つかりません" });
  }

  const videos = await getVehicleVideos(id);
  return NextResponse.json({ data: videos });
}

// FR-INV-010: 動画URL登録。
// system_architecture.md 4.4に従い、動画ファイル自体はアップロードせず外部URLのみを保持する
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id: vehicleId } = await params;
  const vehicle = await getAdminVehicleById(vehicleId);
  if (!vehicle) {
    return apiError({ code: "NOT_FOUND", message: "車両が見つかりません" });
  }

  const json = await request.json();
  const parsed = vehicleVideoFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();

  const { data: existingVideos } = await supabase
    .from("vehicle_videos")
    .select("display_order")
    .eq("vehicle_id", vehicleId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextDisplayOrder = (existingVideos?.[0]?.display_order ?? -1) + 1;

  const { data: video, error } = await supabase
    .from("vehicle_videos")
    .insert({
      vehicle_id: vehicleId,
      video_url: parsed.data.video_url,
      display_order: nextDisplayOrder,
    })
    .select()
    .single();

  if (error || !video) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_video",
    targetId: video.id,
    action: "create",
  });

  return NextResponse.json({ data: video }, { status: 201 });
}
