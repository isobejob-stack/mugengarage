import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { maintenanceRecordFormSchema } from "@/lib/maintenance/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminMaintenanceRecords } from "@/lib/maintenance/queries";
import { replaceRelatedContents } from "@/lib/related/queries";

// FR-MNT-001: 整備実績一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const records = await listAdminMaintenanceRecords();
  return NextResponse.json({ data: records });
}

// FR-MNT-001: 整備実績の新規作成
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

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
  const { data: existing } = await supabase
    .from("maintenance_records")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (existing) {
    return apiError({
      code: "CONFLICT",
      message: "このスラッグは既に使用されています",
      field: "slug",
    });
  }

  const { related, ...values } = parsed.data;
  const { data: record, error } = await supabase
    .from("maintenance_records")
    .insert(values)
    .select()
    .single();

  if (error || !record) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("maintenance_record", record.id, related);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "maintenance_record",
    targetId: record.id,
    action: "create",
  });

  return NextResponse.json({ data: record }, { status: 201 });
}
