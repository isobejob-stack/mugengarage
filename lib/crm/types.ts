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

export type InquiryChannel = "line" | "phone" | "email" | "form";
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
