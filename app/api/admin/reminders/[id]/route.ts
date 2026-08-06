import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";

const bodySchema = z.object({ is_completed: z.boolean() });

// FR-CRM-004: リマインダーの完了・未完了切り替え
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
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "不正な入力です",
    });
  }

  const supabase = createAdminClient();
  const { data: reminder, error } = await supabase
    .from("reminders")
    .update({ is_completed: parsed.data.is_completed })
    .eq("id", id)
    .select()
    .single();

  if (error || !reminder) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "reminder",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: reminder });
}
