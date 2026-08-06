import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Customer,
  CustomerNote,
  Inquiry,
  Reminder,
} from "@/lib/crm/types";

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

// FR-CRM-001: 顧客一覧（論理削除除く、更新順）
export async function listAdminCustomers() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, email, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (data ?? []) as Array<
    Pick<Customer, "id" | "name" | "phone" | "email" | "updated_at">
  >;
}

export async function getAdminCustomerById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<Customer>();

  return data;
}

type TimelineEntry =
  | { type: "inquiry"; date: string; data: Inquiry }
  | { type: "note"; date: string; data: CustomerNote }
  | { type: "reminder"; date: string; data: Reminder };

// FR-CRM-002: 顧客タイムライン（問い合わせ・メモ・リマインダーを時系列で統合表示）
export async function getCustomerTimeline(
  customerId: string,
): Promise<TimelineEntry[]> {
  const supabase = createAdminClient();
  const [{ data: inquiries }, { data: notes }, { data: reminders }] =
    await Promise.all([
      supabase
        .from("inquiries")
        .select("*")
        .eq("customer_id", customerId)
        .returns<Inquiry[]>(),
      supabase
        .from("customer_notes")
        .select("*")
        .eq("customer_id", customerId)
        .returns<CustomerNote[]>(),
      supabase
        .from("reminders")
        .select("*")
        .eq("customer_id", customerId)
        .returns<Reminder[]>(),
    ]);

  const entries: TimelineEntry[] = [
    ...(inquiries ?? []).map((i): TimelineEntry => ({
      type: "inquiry",
      date: i.received_at,
      data: i,
    })),
    ...(notes ?? []).map((n): TimelineEntry => ({
      type: "note",
      date: n.created_at,
      data: n,
    })),
    ...(reminders ?? []).map((r): TimelineEntry => ({
      type: "reminder",
      date: r.due_date,
      data: r,
    })),
  ];

  return entries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}
