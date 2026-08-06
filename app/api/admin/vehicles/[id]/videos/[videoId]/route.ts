import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";

// FR-INV-010: 動画URLの削除。
// vehicle_videos は外部URLの参照のみを保持し deleted_at を持たない（table_definitions.md 4.9）ため、
// 他の主要データ（BR-DEL-001対象）とは異なり物理削除でよい。
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id: vehicleId, videoId } = await params;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("vehicle_videos")
    .select("id")
    .eq("id", videoId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "動画が見つかりません" });
  }

  const { error } = await supabase
    .from("vehicle_videos")
    .delete()
    .eq("id", videoId);

  if (error) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "vehicle_video",
    targetId: videoId,
    action: "delete",
  });

  return NextResponse.json({ data: { id: videoId } });
}
