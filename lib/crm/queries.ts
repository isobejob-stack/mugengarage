import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Inquiry } from "@/lib/crm/types";

// FR-INQ-002: 問い合わせ一覧（管理用、新着順）
export async function listAdminInquiries() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("inquiries")
    .select(
      "id, category, channel, message, response_status, received_at, customers(name)",
    )
    .order("received_at", { ascending: false });

  return (data ?? []) as unknown as Array<{
    id: string;
    category: string;
    channel: string;
    message: string | null;
    response_status: string;
    received_at: string;
    customers: { name: string } | null;
  }>;
}

export async function getAdminInquiryById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("inquiries")
    .select("*, customers(id, name, phone, email)")
    .eq("id", id)
    .maybeSingle();

  return data as
    | (Inquiry & {
        customers: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
        } | null;
      })
    | null;
}
