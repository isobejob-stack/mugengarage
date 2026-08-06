import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { reminderFormSchema } from "@/lib/crm/schema";
import { recordAuditLog } from "@/lib/audit/log";

// FR-CRM-004: リマインダーの追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = reminderFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();
  const { data: reminder, error } = await supabase
    .from("reminders")
    .insert({
      customer_id: id,
      title: parsed.data.title,
      due_date: parsed.data.due_date,
    })
    .select()
    .single();

  if (error || !reminder) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "reminder",
    targetId: reminder.id,
    action: "create",
  });

  return NextResponse.json({ data: reminder }, { status: 201 });
}
