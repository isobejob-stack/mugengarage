import { z } from "zod";

// FR-INQ-001: 問い合わせフォームの入力スキーマ（SCR-PUB-017）
export const inquiryFormSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください"),
    phone: z.string().nullable(),
    email: z
      .string()
      .email("メールアドレスの形式が正しくありません")
      .nullable()
      .or(z.literal("")),
    category: z.enum(["purchase", "repair", "sale", "parts", "other"]),
    message: z.string().min(1, "お問い合わせ内容を入力してください"),
  })
  .refine((data) => Boolean(data.phone) || Boolean(data.email), {
    message: "電話番号かメールアドレスのいずれかを入力してください",
    path: ["phone"],
  });

export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

export const emptyInquiryFormValues = {
  name: "",
  phone: "",
  email: "",
  category: "purchase" as const,
  message: "",
};

export const inquiryCategoryLabels: Record<string, string> = {
  purchase: "購入相談",
  repair: "修理相談",
  sale: "売却相談",
  parts: "部品相談",
  other: "その他",
};

// FR-CRM-001: 顧客情報編集フォーム
export const customerFormSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  phone: z.string().nullable(),
  email: z
    .string()
    .email("メールアドレスの形式が正しくありません")
    .nullable()
    .or(z.literal("")),
  notes: z.string().nullable(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

// FR-CRM-003: 顧客メモ入力フォーム
export const customerNoteFormSchema = z.object({
  body: z.string().min(1, "メモ内容を入力してください"),
});

export type CustomerNoteFormValues = z.infer<typeof customerNoteFormSchema>;

// FR-CRM-004: リマインダー入力フォーム
export const reminderFormSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください"),
  due_date: z.string().min(1, "期日を入力してください"),
});

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;
