import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { maintenanceRecordFormSchema } from "@/lib/maintenance/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminMaintenanceRecordById } from "@/lib/maintenance/queries";
import {
  listRelatedContents,
  replaceRelatedContents,
} from "@/lib/related/queries";

// FR-MNT-001: 整備実績詳細取得（管理用、関連コンテンツ含む）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const record = await getAdminMaintenanceRecordById(id);
  if (!record) {
    return apiError({ code: "NOT_FOUND", message: "整備実績が見つかりません" });
  }

  const related = await listRelatedContents("maintenance_record", id);
  return NextResponse.json({ data: { ...record, related } });
}

// FR-MNT-001: 整備実績編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = maintenanceRecordFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();
  const existing = await getAdminMaintenanceRecordById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "整備実績が見つかりません" });
  }

  if (parsed.data.slug !== existing.slug) {
    const { data: slugTaken } = await supabase
      .from("maintenance_records")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();

    if (slugTaken) {
      return apiError({
        code: "CONFLICT",
        message: "このスラッグは既に使用されています",
        field: "slug",
      });
    }
  }

  const { related, ...values } = parsed.data;
  const { data: record, error } = await supabase
    .from("maintenance_records")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error || !record) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("maintenance_record", id, related);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "maintenance_record",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: record });
}
