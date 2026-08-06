import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { encyclopediaEntryFormSchema } from "@/lib/knowledge/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminEncyclopediaEntries } from "@/lib/knowledge/queries";

// FR-ENC-001: 図鑑一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const entries = await listAdminEncyclopediaEntries();
  return NextResponse.json({ data: entries });
}

// FR-ENC-001: 図鑑項目の新規作成（BR-DOM-001: Vehicleへの外部キーを持たない）
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

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

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("encyclopedia_entries")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (existing) {
    return apiError({
      code: "CONFLICT",
      message: "このスラッグは既に使用されています",
      field: "slug",
    });
  }

  // encyclopedia_entriesテーブル自体はseoカラムを持たないため、insert対象から除外する
  // （SEOメタ情報はseo_metasで別途管理）
  const { seo: _seo, ...entryValues } = parsed.data;

  const { data: entry, error } = await supabase
    .from("encyclopedia_entries")
    .insert(entryValues)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "encyclopedia_entry",
    targetId: entry.id,
    action: "create",
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
