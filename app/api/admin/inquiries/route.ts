import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError } from "@/lib/api/error-response";
import { listAdminInquiries } from "@/lib/crm/queries";

// FR-INQ-002: 問い合わせ一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const inquiries = await listAdminInquiries();
  return NextResponse.json({ data: inquiries });
}
