import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { encyclopediaEntryFormSchema } from "@/lib/knowledge/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminEncyclopediaEntryById } from "@/lib/knowledge/queries";

// FR-ENC-001: 図鑑項目詳細取得（管理用）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const entry = await getAdminEncyclopediaEntryById(id);
  if (!entry) {
    return apiError({ code: "NOT_FOUND", message: "図鑑項目が見つかりません" });
  }

  return NextResponse.json({ data: entry });
}

// FR-ENC-001: 図鑑項目編集
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const json = await request.json();
  const parsed = encyclopediaEntryFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  if (parsed.data.parent_id === id) {
    return apiError({
      code: "VALIDATION_ERROR",
      message: "自分自身を親項目には設定できません",
      field: "parent_id",
    });
  }

  const supabase = createAdminClient();
  const existing = await getAdminEncyclopediaEntryById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "図鑑項目が見つかりません" });
  }

  if (parsed.data.slug !== existing.slug) {
    const { data: slugTaken } = await supabase
      .from("encyclopedia_entries")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();

    if (slugTaken) {
      return apiError({
        code: "CONFLICT",
        message: "このスラッグは既に使用されています",
        field: "slug",
      });
    }
  }

  const { data: entry, error } = await supabase
    .from("encyclopedia_entries")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "encyclopedia_entry",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: entry });
}
