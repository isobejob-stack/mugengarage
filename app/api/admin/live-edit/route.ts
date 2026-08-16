import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { recordAuditLog } from "@/lib/audit/log";
import { resolveEditableField } from "@/lib/live-edit/registry";

// ライブ編集の保存口（1項目だけを書き換える）。
//
// 既存の PATCH /api/admin/<domain>/<id> はフォーム全体のスキーマ検証を前提にしており、
// 1項目だけ送ると必須項目が足りずに落ちる。ライブ編集は「画面のこの文字だけ直す」操作なので、
// 項目単位で書ける口を別に用意する。
//
// 安全側の作り:
//   - テーブル名・列名はリクエストから受け取らない。lib/live-edit/registry.ts の
//     許可リストに載っている組み合わせだけを、そこに書かれたテーブル・列へ書く
//   - 値の型は許可リストの input 種別で決まる（number の欄に文字列は入らない）
//   - 書き込みは必ず監査ログに残す（BR-HIST-002）
// 編集パネルを開いたときに、いま保存されている生の値を取りに来る口。
//
// 画面に出ている文字をそのまま初期値にはできない。本文はMarkdownを描画した結果であり、
// 価格は「228万円」のように整形された表示になっているため、
// 画面の文字を編集させると書式ごと壊れる。必ずDBの生の値を渡す。
export async function GET(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const id = searchParams.get("id") ?? "";
  const field = searchParams.get("field") ?? "";

  const resolved = resolveEditableField(type, field);
  if (!resolved) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "この項目はこの画面からは編集できません",
      field,
    });
  }

  const { target } = resolved;
  const supabase = createAdminClient();

  if (target.keyed) {
    const { data } = await supabase
      .from(target.table)
      .select("value")
      .eq("key", id)
      .maybeSingle();
    // 未編集の文言はDBに行が無い。呼び出し側が既定文言で埋める。
    return NextResponse.json({ data: { value: data?.value ?? null } });
  }

  const { data, error } = await supabase
    .from(target.table)
    .select(field)
    .eq("id", target.singletonId ?? id)
    .maybeSingle();

  if (error) return apiInternalError(error);
  if (!data) {
    return apiError({ code: "NOT_FOUND", message: "編集対象が見つかりません" });
  }

  // 列名を変数で指定しているため、Supabaseの型推論では行の形が定まらない。
  // 列名は許可リスト由来で安全なので、ここは実行時の形に合わせて読み出す。
  const row = data as unknown as Record<string, unknown>;

  return NextResponse.json({ data: { value: row[field] ?? null } });
}

export async function PATCH(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    id?: string;
    field?: string;
    value?: unknown;
    description?: string;
  } | null;

  if (!body?.type || !body.id || !body.field) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "編集対象が指定されていません",
    });
  }

  const resolved = resolveEditableField(body.type, body.field);
  if (!resolved) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "この項目はこの画面からは編集できません",
      field: body.field,
    });
  }

  const { target, config } = resolved;

  // 入力種別ごとに値を整える。
  // 空欄はnullとして保存する（空文字を書き込むと、未入力なのか空文字なのか区別できなくなる）。
  let value: string | number | null;
  if (config.input === "number") {
    if (body.value === null || body.value === "" || body.value === undefined) {
      value = null;
    } else {
      const parsed = Number(body.value);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        return apiError({
          code: "VALIDATION_ERROR",
          message: `${config.label}は整数で入力してください`,
          field: body.field,
        });
      }
      value = parsed;
    }
  } else {
    if (typeof body.value !== "string" && body.value !== null) {
      return apiError({
        code: "VALIDATION_ERROR",
        message: `${config.label}の値が不正です`,
        field: body.field,
      });
    }
    const text = typeof body.value === "string" ? body.value : "";
    // 1行のテキストは前後の空白を落とす。本文（Markdown）は改行や
    // 行頭の空白に意味があるため触らない。
    const normalized = config.input === "text" ? text.trim() : text;
    value = normalized === "" ? null : normalized;
  }

  const supabase = createAdminClient();

  if (target.keyed) {
    // 画面の固定文言。編集して初めて行ができる。
    // 空にされたときは行を消す（コード側の既定文言に戻す、が最も自然な挙動）。
    if (value === null) {
      const { error } = await supabase
        .from(target.table)
        .delete()
        .eq("key", body.id);
      if (error) return apiInternalError(error);
    } else {
      const { error } = await supabase.from(target.table).upsert(
        {
          key: body.id,
          value: String(value),
          description: body.description ?? null,
        },
        { onConflict: "key" },
      );
      if (error) return apiInternalError(error);
    }
  } else {
    // 単一行テーブル（店舗情報）はリクエストのidを信用せず固定IDで更新する
    const rowId = target.singletonId ?? body.id;
    const { data, error } = await supabase
      .from(target.table)
      .update({ [body.field]: value })
      .eq("id", rowId)
      .select("id")
      .maybeSingle();

    if (error) return apiInternalError(error);
    if (!data) {
      return apiError({
        code: "NOT_FOUND",
        message: "編集対象が見つかりません",
      });
    }
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: body.type,
    targetId: target.singletonId ?? body.id,
    action: "update",
    changes: { [body.field]: value },
  });

  return NextResponse.json({ data: { value } });
}
