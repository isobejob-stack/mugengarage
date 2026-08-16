import type { BaseEntity, SoftDeletable } from "@/lib/database/common";

// CRM Context（bounded_context.md 3章）: 顧客・問い合わせ・対応履歴の管理

export interface Customer extends BaseEntity, SoftDeletable {
  name: string;
  phone: string | null;
  email: string | null;
  // 将来のLINE連携を見据えた予約カラム（table_definitions.md 8.1）
  line_user_id: string | null;
  notes: string | null;
}

// "form" は公開フォーム（app/api/inquiries）専用。管理画面からの手動登録（FR-INQ-002）は
// "form" を受け付けないため、チャネルだけで「フォーム由来か、店側が手で記録したものか」を判別できる。
// "visit"（来店）はこの店で実際に多い流入経路だが、DBのCHECK制約には後から追加する必要がある
// （supabase/migrations/20260817090000_add_visit_channel_to_inquiries.sql）。
export type InquiryChannel = "line" | "phone" | "email" | "form" | "visit";
export type InquiryCategory =
  "purchase" | "repair" | "sale" | "parts" | "other";
export type InquiryResponseStatus = "unhandled" | "in_progress" | "completed";

export interface Inquiry extends BaseEntity {
  customer_id: string | null;
  vehicle_id: string | null;
  channel: InquiryChannel;
  category: InquiryCategory;
  message: string | null;
  response_status: InquiryResponseStatus;
  received_at: string;
}

export interface CustomerNote extends BaseEntity {
  customer_id: string;
  body: string;
}

export interface Reminder extends BaseEntity {
  customer_id: string;
  title: string;
  due_date: string;
  is_completed: boolean;
}

// FR-CRM-004（横断一覧）: 顧客を1件ずつ開かずに期日を確認するための一覧行。
// 誰への対応かが分からないと一覧の意味が無いため、顧客名を必ず伴う。
export interface ReminderListItem
  extends Pick<
    Reminder,
    "id" | "customer_id" | "title" | "due_date" | "is_completed"
  > {
  customers: { id: string; name: string };
}
