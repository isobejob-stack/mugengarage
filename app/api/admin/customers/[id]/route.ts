import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { customerFormSchema } from "@/lib/crm/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminCustomerById } from "@/lib/crm/queries";

// FR-CRM-001: 顧客詳細取得（管理用）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const customer = await getAdminCustomerById(id);
  if (!customer) {
    return apiError({ code: "NOT_FOUND", message: "顧客が見つかりません" });
  }

  return NextResponse.json({ data: customer });
}

// FR-CRM-001: 顧客情報編集
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
  const parsed = customerFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const existing = await getAdminCustomerById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "顧客が見つかりません" });
  }

  const supabase = createAdminClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !customer) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "customer",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: customer });
}
