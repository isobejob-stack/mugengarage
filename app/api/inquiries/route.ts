import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { inquiryFormSchema } from "@/lib/crm/schema";
import { getSessionId } from "@/lib/engagement/session";
import { linkFavoritesToCustomer } from "@/lib/engagement/queries";

// FR-INQ-001: 問い合わせフォーム送信（公開、認証不要）
// event_flow.md 3.5: 既存Customerと紐付けるか、新規Customerを作成する（FR-INQ-003）
export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = inquiryFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const { name, phone, email, category, message } = parsed.data;
  const supabase = createAdminClient();

  let customerId: string | null = null;

  if (phone || email) {
    let existingQuery = supabase
      .from("customers")
      .select("id")
      .is("deleted_at", null);
    existingQuery = phone
      ? existingQuery.eq("phone", phone)
      : existingQuery.eq("email", email as string);
    const { data: existingCustomer } = await existingQuery.maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from("customers")
        .insert({ name, phone: phone || null, email: email || null })
        .select("id")
        .single();

      if (customerError || !newCustomer) {
        return apiInternalError(customerError);
      }
      customerId = newCustomer.id;
    }
  }

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      customer_id: customerId,
      channel: "form",
      category,
      message,
      response_status: "unhandled",
    })
    .select()
    .single();

  if (error || !inquiry) {
    return apiInternalError(error);
  }

  // FR-CRM-005: inquiryの登録が確定した後、顧客に同じ匿名セッションのfavoritesを
  // 紐付ける（event_flow.md 3.4 #3）。favoritesはEngagement Context所有のため
  // lib/engagement/queries.tsの関数経由で更新する（bounded_context.md）。
  // 紐付け更新はあくまで補助的な処理であり、失敗してもinquiry登録のレスポンスは継続する。
  if (customerId) {
    const sessionId = await getSessionId();
    if (sessionId) {
      const { error: favoritesError } = await linkFavoritesToCustomer(
        sessionId,
        customerId,
      );

      if (favoritesError) {
        console.error(favoritesError);
      }
    }
  }

  return NextResponse.json({ data: inquiry }, { status: 201 });
}
