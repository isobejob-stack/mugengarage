import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { vehiclePhotoReorderSchema } from "@/lib/inventory/schema";
import { getAdminVehicleById, getVehiclePhotos } from "@/lib/inventory/queries";

// FR-INV-009: 写真の並び替え（rest_api.md 4章: PATCH /api/admin/vehicles/:id/photos/reorder）
// リクエストボディの photoIds の配列順を display_order（0始まり）としてまとめて更新する
export async function PATCH(
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
  const parsed = vehiclePhotoReorderSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const existingPhotos = await getVehiclePhotos(vehicleId);
  const existingIds = new Set(existingPhotos.map((photo) => photo.id));
  const requestedIds = parsed.data.photoIds;

  const isValidSet =
    requestedIds.length === existingIds.size &&
    requestedIds.every((photoId) => existingIds.has(photoId));

  if (!isValidSet) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "対象車両の写真と一致しません",
      field: "photoIds",
    });
  }

  const supabase = createAdminClient();

  const results = await Promise.all(
    requestedIds.map((photoId, index) =>
      supabase
        .from("vehicle_photos")
        .update({ display_order: index })
        .eq("id", photoId)
        .eq("vehicle_id", vehicleId),
    ),
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return apiInternalError(failed.error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_photo",
    targetId: vehicleId,
    action: "update",
    changes: { reordered: requestedIds },
  });

  const photos = await getVehiclePhotos(vehicleId);
  return NextResponse.json({ data: photos });
}
