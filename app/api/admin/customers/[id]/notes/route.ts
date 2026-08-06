import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { customerNoteFormSchema } from "@/lib/crm/schema";
import { recordAuditLog } from "@/lib/audit/log";

// FR-CRM-003: 顧客メモの追加
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
  const parsed = customerNoteFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();
  const { data: note, error } = await supabase
    .from("customer_notes")
    .insert({ customer_id: id, body: parsed.data.body })
    .select()
    .single();

  if (error || !note) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "customer_note",
    targetId: note.id,
    action: "create",
  });

  return NextResponse.json({ data: note }, { status: 201 });
}
