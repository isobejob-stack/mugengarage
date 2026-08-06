import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { ownerArchiveEntryFormSchema } from "@/lib/archive/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminOwnerArchiveEntry } from "@/lib/archive/queries";

// FR-OWN-002: オーナーズアーカイブ詳細取得（管理用、未作成なら自動作成）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { vehicleId } = await params;
  const entry = await getAdminOwnerArchiveEntry(vehicleId);
  if (!entry) {
    return apiError({
      code: "NOT_FOUND",
      message: "アーカイブ情報が見つかりません",
    });
  }

  return NextResponse.json({ data: entry });
}

// FR-OWN-002: レストア履歴・販売履歴・公開設定の編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { vehicleId } = await params;
  const json = await request.json();
  const parsed = ownerArchiveEntryFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const existing = await getAdminOwnerArchiveEntry(vehicleId);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "アーカイブ情報が見つかりません",
    });
  }

  const supabase = createAdminClient();
  const { data: entry, error } = await supabase
    .from("owner_archive_entries")
    .update(parsed.data)
    .eq("vehicle_id", vehicleId)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "owner_archive_entry",
    targetId: entry.id,
    action: "update",
  });

  return NextResponse.json({ data: entry });
}
