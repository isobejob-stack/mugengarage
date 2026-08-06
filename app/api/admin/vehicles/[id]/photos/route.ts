import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminVehicleById, getVehiclePhotos } from "@/lib/inventory/queries";
import {
  VEHICLE_PHOTOS_BUCKET,
  buildVehiclePhotoStoragePath,
  getVehiclePhotoPublicUrl,
} from "@/lib/inventory/storage";
import {
  MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
  type VehiclePhoto,
} from "@/lib/inventory/types";

// FR-INV-009: 車両写真一覧取得（管理用、編集フォームのサムネイル表示用）
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

  const photos = await getVehiclePhotos(id);
  return NextResponse.json({
    data: photos.map((photo) => ({
      ...photo,
      public_url: getVehiclePhotoPublicUrl(photo.storage_path),
    })),
  });
}

// FR-INV-009: 写真アップロード（複数枚同時可）。
// Supabase Storage（vehicle-photosバケット、公開バケット）へアップロードした上で
// vehicle_photos にレコードを追加する。既存の最大display_orderの続きに追加する。
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

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "アップロードする写真を選択してください",
      field: "files",
    });
  }

  const nonImage = files.find((file) => !file.type.startsWith("image/"));
  if (nonImage) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "画像ファイルのみアップロードできます",
      field: "files",
    });
  }

  // 03_non_functional_requirements.md 9章: アップロードファイルのサイズを制限する
  const tooLarge = files.find(
    (file) => file.size > MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
  );
  if (tooLarge) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: `1ファイルあたり${
        MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES / (1024 * 1024)
      }MBまでの画像をアップロードできます`,
      field: "files",
    });
  }

  const supabase = createAdminClient();

  const { data: existingPhotos } = await supabase
    .from("vehicle_photos")
    .select("display_order")
    .eq("vehicle_id", vehicleId)
    .is("deleted_at", null)
    .order("display_order", { ascending: false })
    .limit(1);

  let nextDisplayOrder = (existingPhotos?.[0]?.display_order ?? -1) + 1;

  const uploaded: VehiclePhoto[] = [];

  for (const file of files) {
    const storagePath = buildVehiclePhotoStoragePath(vehicleId, file.name);

    const { error: uploadError } = await supabase.storage
      .from(VEHICLE_PHOTOS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      return apiInternalError(uploadError);
    }

    const { data: photo, error: insertError } = await supabase
      .from("vehicle_photos")
      .insert({
        vehicle_id: vehicleId,
        storage_path: storagePath,
        display_order: nextDisplayOrder,
      })
      .select()
      .single<VehiclePhoto>();

    if (insertError || !photo) {
      // vehicle_photos への insert が失敗した場合はStorage側のオブジェクトも残さない
      await supabase.storage.from(VEHICLE_PHOTOS_BUCKET).remove([storagePath]);
      return apiInternalError(insertError);
    }

    uploaded.push(photo);
    nextDisplayOrder += 1;
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_photo",
    targetId: vehicleId,
    action: "create",
    changes: { uploaded_count: uploaded.length },
  });

  return NextResponse.json(
    {
      data: uploaded.map((photo) => ({
        ...photo,
        public_url: getVehiclePhotoPublicUrl(photo.storage_path),
      })),
    },
    { status: 201 },
  );
}
