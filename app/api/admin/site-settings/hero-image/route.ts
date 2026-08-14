import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import {
  SITE_ASSETS_BUCKET,
  MAX_SITE_ASSET_FILE_SIZE_BYTES,
  buildSiteAssetStoragePath,
  getSiteAssetPublicUrl,
} from "@/lib/settings/storage";

// トップページのヒーロー画像をアップロードする。
// 店舗外観やガレージの写真など、特定の車両に紐づかない「店そのものを伝える写真」を、
// 開発を介さず管理画面から差し替えられるようにするためのエンドポイント。
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "画像ファイルを選択してください",
      field: "file",
    });
  }

  // 画像以外が上がってくると公開サイトで壊れた表示になるため、種類を絞る
  if (!file.type.startsWith("image/")) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "画像ファイルを選択してください",
      field: "file",
    });
  }

  if (file.size > MAX_SITE_ASSET_FILE_SIZE_BYTES) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: `ファイルサイズが上限（${
        MAX_SITE_ASSET_FILE_SIZE_BYTES / (1024 * 1024)
      }MB）を超えています`,
      field: "file",
    });
  }

  const supabase = createAdminClient();
  const storagePath = buildSiteAssetStoragePath("hero", file.name);

  const { error: uploadError } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return apiInternalError(uploadError);
  }

  // 差し替え前の画像パスを控えておき、DB更新に成功したら古い方を削除する。
  // 先に消すと、DB更新に失敗したときに「参照先が存在しない」状態になるため順序が重要。
  const { data: current } = await supabase
    .from("site_settings")
    .select("hero_image_path")
    .eq("id", "singleton")
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("site_settings")
    .update({
      hero_image_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "singleton");

  if (updateError) {
    // DBに紐付けられなかったアップロード済みファイルは孤児になるため取り消す
    await supabase.storage.from(SITE_ASSETS_BUCKET).remove([storagePath]);
    return apiInternalError(updateError);
  }

  if (current?.hero_image_path) {
    // 失敗しても実害は「使われないファイルが残る」だけなので、結果は見ない
    await supabase.storage
      .from(SITE_ASSETS_BUCKET)
      .remove([current.hero_image_path]);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "site_setting",
    targetId: "singleton",
    action: "update",
    changes: { hero_image_path: storagePath },
  });

  return NextResponse.json({
    data: {
      hero_image_path: storagePath,
      public_url: getSiteAssetPublicUrl(storagePath),
    },
  });
}

// ヒーロー画像を取り消して、文字ベースの既定表示に戻す
export async function DELETE() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("site_settings")
    .select("hero_image_path")
    .eq("id", "singleton")
    .maybeSingle();

  const { error } = await supabase
    .from("site_settings")
    .update({ hero_image_path: null, updated_at: new Date().toISOString() })
    .eq("id", "singleton");

  if (error) {
    return apiInternalError(error);
  }

  if (current?.hero_image_path) {
    await supabase.storage
      .from(SITE_ASSETS_BUCKET)
      .remove([current.hero_image_path]);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "site_setting",
    targetId: "singleton",
    action: "update",
    changes: { hero_image_path: null },
  });

  return NextResponse.json({ data: { hero_image_path: null } });
}
