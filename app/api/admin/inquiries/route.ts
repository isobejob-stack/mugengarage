import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { manualInquirySchema } from "@/lib/crm/schema";
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

// 受付日時は <input type="datetime-local"> の値（例 "2026-08-17T14:30"）で届く。
// この文字列にはタイムゾーンが無く、そのまま new Date() に渡すと**サーバーのローカル時刻**
// として解釈される。本番（Vercel）のサーバーはUTCなので、日本時間の14:30が23:30として
// 保存され、タイムラインの並び順が9時間ずれる。運用者は日本国内で入力するため、
// 明示的にJST（+09:00）として解釈する。
function jstLocalToIso(localDateTime: string): string {
  return new Date(`${localDateTime}:00+09:00`).toISOString();
}

// FR-INQ-002 / event_flow.md 3.5:
// 電話・LINE・来店で受けた相談を、管理画面から手動で記録する。
//
// 従来Inquiryを作れるのは公開フォーム（channel='form'）だけで、この店で最も多い
// 流入経路である電話とLINEの記録が全て失われていた。
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  // 壊れたJSONを送られても500にせず、検証エラーとして返す（公開フォーム側と同じ扱い）
  const json = await request.json().catch(() => null);
  if (json === null) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "リクエストの形式が正しくありません",
    });
  }

  const parsed = manualInquirySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const values = parsed.data;
  const supabase = createAdminClient();

  // FR-INQ-003: 既存Customerと紐付けるか、新規Customerを作成する（event_flow.md 3.5 #2）
  let customerId: string | null = null;

  if (values.customer_mode === "existing") {
    const selectedId = values.customer_id?.trim();
    if (!selectedId) {
      return apiError({
        code: "VALIDATION_ERROR",
        message: "顧客を選択してください",
        field: "customer_id",
      });
    }

    // 選択肢は画面描画時点の一覧なので、その間に削除された顧客を指している可能性がある
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("id", selectedId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) {
      return apiError({
        code: "NOT_FOUND",
        message: "選択した顧客が見つかりません",
        field: "customer_id",
      });
    }

    customerId = existing.id;
  } else if (values.customer_mode === "new") {
    const name = values.customer_name?.trim();
    if (!name) {
      return apiError({
        code: "VALIDATION_ERROR",
        message: "お名前を入力してください",
        field: "customer_name",
      });
    }

    const phone = values.customer_phone?.trim() || null;
    const email = values.customer_email?.trim() || null;

    // 同じ連絡先の顧客が既にいれば作り直さず紐付ける（公開フォームと同じ方針）。
    // 電話で受けた相談を毎回「新規」で登録しても、同じ人の履歴が分裂しないようにする。
    // limit(1) を付けているのは、同一連絡先が複数登録されていた場合に maybeSingle が
    // エラーになり、重複顧客を黙って増やしてしまうのを避けるため。
    if (phone || email) {
      let lookup = supabase
        .from("customers")
        .select("id")
        .is("deleted_at", null);
      lookup = phone
        ? lookup.eq("phone", phone)
        : lookup.eq("email", email as string);

      const { data: duplicate } = await lookup.limit(1).maybeSingle();
      if (duplicate) {
        customerId = duplicate.id;
      }
    }

    if (!customerId) {
      const { data: created, error: customerError } = await supabase
        .from("customers")
        .insert({ name, phone, email })
        .select("id")
        .single();

      if (customerError || !created) {
        return apiInternalError(customerError);
      }

      customerId = created.id;

      await recordAuditLog({
        adminUserId: user.id,
        targetType: "customer",
        targetId: created.id,
        action: "create",
      });
    }
  }

  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      customer_id: customerId,
      channel: values.channel,
      category: values.category,
      message: values.message.trim(),
      // 店頭でその場で解決した相談を「未対応」で積み上げると、ダッシュボードの
      // 未対応件数が実態と合わなくなるため、登録時の値をそのまま使う
      response_status: values.response_status,
      // 未指定ならDBのデフォルト（now()）に任せる
      ...(values.received_at
        ? { received_at: jstLocalToIso(values.received_at) }
        : {}),
    })
    .select()
    .single();

  if (error || !inquiry) {
    // 23514 = CHECK制約違反。'visit'（来店）はDB側のCHECK制約に後から追加する必要があり、
    // マイグレーション未適用のあいだは保存できない。原因不明の500として返すと
    // 運用者は入力内容を疑い続けることになるので、何が起きているかを伝える。
    if (error?.code === "23514") {
      return apiError({
        code: "VALIDATION_ERROR",
        message:
          "この受付方法はまだデータベースに登録されていません。サイト管理者にご連絡ください",
        field: "channel",
      });
    }

    return apiInternalError(error);
  }

  // BR-HIST-002: 誰がいつ手で登録したかを監査ログに残す。
  // 手動登録は「後から内容を訂正したい」問い合わせが出やすいため、
  // 登録時点の主要項目をchangesに残しておく。
  await recordAuditLog({
    adminUserId: user.id,
    targetType: "inquiry",
    targetId: inquiry.id,
    action: "create",
    changes: {
      channel: values.channel,
      category: values.category,
      response_status: values.response_status,
      customer_id: customerId,
    },
  });

  return NextResponse.json({ data: inquiry }, { status: 201 });
}
