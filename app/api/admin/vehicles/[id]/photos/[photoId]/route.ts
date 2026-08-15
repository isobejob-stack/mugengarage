import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import {
  MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
  type VehiclePhoto,
} from "@/lib/inventory/types";
import {
  VEHICLE_PHOTOS_BUCKET,
  buildVehiclePhotoStoragePath,
  getVehiclePhotoPublicUrl,
} from "@/lib/inventory/storage";

// FR-INV-009: 写真の差し替え（トリミング結果の保存に使う）。
//
// 同じStorageパスへ上書きせず、新しいパスへ保存してから行のstorage_pathを差し替える。
// 上書きにすると公開URLが変わらないため、CDNに残った古い画像が表示され続け、
// 「トリミングしたのに反映されない」という状態になるため。
// display_order は行を維持するのでそのまま保たれ、並び順やメイン写真の指定は崩れない。
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id: vehicleId, photoId } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("id", photoId)
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .maybeSingle<VehiclePhoto>();

  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "写真が見つかりません" });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "差し替える画像がありません",
      field: "file",
    });
  }
  if (file.size > MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: `画像のサイズが上限（${MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES / (1024 * 1024)}MB）を超えています`,
      field: "file",
    });
  }

  const newPath = buildVehiclePhotoStoragePath(vehicleId, file.name);
  const { error: uploadError } = await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .upload(newPath, file, { contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return apiInternalError(uploadError);
  }

  const { data: photo, error } = await supabase
    .from("vehicle_photos")
    .update({ storage_path: newPath })
    .eq("id", photoId)
    .select()
    .single();

  if (error || !photo) {
    // DB更新に失敗したらアップロード済みのファイルを消す（孤児ファイルを残さない）
    await supabase.storage.from(VEHICLE_PHOTOS_BUCKET).remove([newPath]);
    return apiInternalError(error);
  }

  // 差し替え前のファイルは参照されなくなるため削除する。
  // 失敗しても利用者の操作は成立しているので、処理は続行する。
  await supabase.storage
    .from(VEHICLE_PHOTOS_BUCKET)
    .remove([existing.storage_path]);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_photo",
    targetId: photoId,
    action: "update",
  });

  return NextResponse.json({
    data: { ...photo, public_url: getVehiclePhotoPublicUrl(newPath) },
  });
}

// FR-INV-009: 写真削除。
// BR-DEL-001（物理削除の禁止）に従い、deleted_at をセットする論理削除とする。
// Storage側の実ファイルは削除しない（このAPIでは扱わない。将来的な完全削除はバッチ運用で検討）。
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id: vehicleId, photoId } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("vehicle_photos")
    .select("*")
    .eq("id", photoId)
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .maybeSingle<VehiclePhoto>();

  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "写真が見つかりません" });
  }

  const { data: photo, error } = await supabase
    .from("vehicle_photos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", photoId)
    .select()
    .single();

  if (error || !photo) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_photo",
    targetId: photoId,
    action: "delete",
  });

  return NextResponse.json({ data: photo });
}
