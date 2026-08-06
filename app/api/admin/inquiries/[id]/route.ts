import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminInquiryById } from "@/lib/crm/queries";

const updateSchema = z.object({
  response_status: z.enum(["unhandled", "in_progress", "completed"]),
});

// FR-INQ-002: 問い合わせ詳細取得（管理用）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const inquiry = await getAdminInquiryById(id);
  if (!inquiry) {
    return apiError({
      code: "NOT_FOUND",
      message: "問い合わせが見つかりません",
    });
  }

  return NextResponse.json({ data: inquiry });
}

// FR-INQ-004: 対応ステータス管理
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
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "対応ステータスの値が不正です",
      field: "response_status",
    });
  }

  const supabase = createAdminClient();
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .update({ response_status: parsed.data.response_status })
    .eq("id", id)
    .select()
    .single();

  if (error || !inquiry) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "inquiry",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: inquiry });
}
