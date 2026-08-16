import { z } from "zod";
import type {
  InquiryChannel,
  InquiryResponseStatus,
} from "@/lib/crm/types";

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
    // ハニーポット（FR-INQ-001の補強 / docs/tasks/ISSUE-005）。
    // 画面上は視覚的にもスクリーンリーダーからも隠したダミー入力欄で、人間は絶対に入力しない。
    // フォームを機械的に走査して全項目を埋めるボットだけがここに値を入れるため、
    // 値が入っていたらスパムと判定する。
    // CAPTCHAと違い、正規の利用者には操作の負担が一切かからないのが利点。
    // 送信されないケース（古いキャッシュ等）も許容するためoptionalにする。
    website: z.string().optional(),
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
  website: "",
};

export const inquiryCategoryLabels: Record<string, string> = {
  purchase: "購入相談",
  repair: "修理相談",
  sale: "売却相談",
  parts: "部品相談",
  other: "その他",
};

// チャネル・対応状況のラベルは、問い合わせ一覧・詳細・顧客タイムラインの3画面で
// それぞれ別々に定義されており、チャネルを1つ増やすだけで表示漏れ（空欄）が起きる状態だった。
// 手動登録（FR-INQ-002）で "visit" を追加するにあたり、定義をここに集約する。
// satisfies により、InquiryChannel を増やしたときにラベルの追加漏れをコンパイル時に検出する。
export const inquiryChannelLabels: Record<string, string> = {
  line: "LINE",
  phone: "電話",
  email: "メール",
  visit: "来店",
  form: "フォーム",
} satisfies Record<InquiryChannel, string>;

export const inquiryResponseStatusLabels: Record<string, string> = {
  unhandled: "未対応",
  in_progress: "対応中",
  completed: "完了",
} satisfies Record<InquiryResponseStatus, string>;

// 色だけで状態を伝えないため、バッジは必ずラベル文字列とセットで使う（03_ui_rules.md 7章）
export const inquiryResponseStatusTones: Record<
  string,
  "danger" | "warning" | "success"
> = {
  unhandled: "danger",
  in_progress: "warning",
  completed: "success",
} satisfies Record<InquiryResponseStatus, "danger" | "warning" | "success">;

// FR-INQ-002 / event_flow.md 3.5: 電話・LINE・来店で受けた相談を管理画面から手で記録する。
//
// 公開フォーム（channel='form'）でしかInquiryを作れなかったため、この店で最も多い
// 流入経路である電話とLINEの記録が丸ごと残らず、顧客タイムラインも実態と乖離していた。
//
// 手動登録では 'form' を選ばせない。公開フォーム由来かどうかをチャネルだけで
// 判別できる状態を保つため（isManualInquiry）。
export const manualInquiryChannels = [
  "phone",
  "line",
  "visit",
  "email",
] as const;

export const manualInquiryCustomerModes = ["existing", "new", "none"] as const;

export const manualInquirySchema = z
  .object({
    channel: z.enum(manualInquiryChannels),
    category: z.enum(["purchase", "repair", "sale", "parts", "other"]),
    message: z.string().min(1, "相談内容を入力してください"),
    // 店頭で受けてその場で解決した相談まで「未対応」で積み上がると、
    // ダッシュボードの未対応件数が実態と合わなくなるため、登録時に選ばせる。
    response_status: z.enum(["unhandled", "in_progress", "completed"]),
    // 受付日時（datetime-localのローカル日時文字列）。
    // 後からまとめて記録することがあるため、実際に受けた日時を指定できる。
    // 空欄なら登録時刻（DB側のnow()）を使う。
    received_at: z
      .string()
      .regex(
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/,
        "受付日時の形式が正しくありません",
      )
      .optional(),
    // 顧客の扱い: 既存から選ぶ / その場で新規登録する / 紐付けない
    // （名乗らずに切れた電話など、顧客レコードを作れないケースがあるため "none" を残す）
    customer_mode: z.enum(manualInquiryCustomerModes),
    customer_id: z.string().optional(),
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
    customer_email: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.customer_mode === "existing" && !data.customer_id) {
      ctx.addIssue({
        code: "custom",
        message: "顧客を選択してください",
        path: ["customer_id"],
      });
    }

    if (data.customer_mode === "new") {
      if (!data.customer_name?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "お名前を入力してください",
          path: ["customer_name"],
        });
      }

      // 連絡先は必須にしない。店頭で名前だけ伺うことがあり、そこで入力を止めると
      // 「記録が残らない」という元の問題に戻ってしまうため。
      const email = data.customer_email?.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        ctx.addIssue({
          code: "custom",
          message: "メールアドレスの形式が正しくありません",
          path: ["customer_email"],
        });
      }
    }
  });

export type ManualInquiryValues = z.infer<typeof manualInquirySchema>;

export const emptyManualInquiryValues: ManualInquiryValues = {
  channel: "phone",
  category: "purchase",
  message: "",
  response_status: "unhandled",
  received_at: "",
  customer_mode: "new",
  customer_id: "",
  customer_name: "",
  customer_phone: "",
  customer_email: "",
};

// 公開フォーム由来か、店側が手で記録したものかの判定。
// 公開エンドポイントは channel='form' 固定で作成し、管理用POSTは 'form' を受け付けないため、
// チャネルだけで由来が決まる。判定を1か所に集約し、画面ごとの解釈のブレを防ぐ。
export function isManualInquiry(channel: string): boolean {
  return channel !== "form";
}

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
