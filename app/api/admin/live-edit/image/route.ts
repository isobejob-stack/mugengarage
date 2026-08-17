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

// 本文の途中に差し込む画像のアップロード口。
//
// 車両写真（vehicle_photos）は「その車の写真」として車両に紐づくが、
// 記事や図鑑の本文に入れたい写真は特定の車両に属さない。
// エンジンルームの寄り、部品の比較、作業中の様子など、
// 文章の流れの中に置いて初めて意味を持つ写真がこれにあたる。
//
// 保存先は site-assets バケットの content/ 配下。DBには行を作らず、
// 返した公開URLを本文のMarkdownに ![](url) として埋め込む形にしている。
// 「どの本文で使われているか」はMarkdownを見れば分かるため、
// 別テーブルで管理しても二重管理になるだけと判断した。
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
  const storagePath = buildSiteAssetStoragePath("content", file.name);

  const { error: uploadError } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(storagePath, file, { contentType: file.type });

  if (uploadError) {
    return apiInternalError(uploadError);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "site_asset",
    targetId: storagePath,
    action: "create",
  });

  return NextResponse.json({
    data: { url: getSiteAssetPublicUrl(storagePath), path: storagePath },
  });
}
