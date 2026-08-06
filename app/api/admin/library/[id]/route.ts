import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { libraryEntryFormSchema } from "@/lib/library/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminLibraryEntryById } from "@/lib/library/queries";
import {
  listRelatedContents,
  replaceRelatedContents,
} from "@/lib/related/queries";

// FR-LIB-001: ライブラリ項目詳細取得（管理用、関連コンテンツ含む）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const entry = await getAdminLibraryEntryById(id);
  if (!entry) {
    return apiError({
      code: "NOT_FOUND",
      message: "ライブラリ項目が見つかりません",
    });
  }

  const related = await listRelatedContents("library_entry", id);
  return NextResponse.json({ data: { ...entry, related } });
}

// FR-LIB-001: ライブラリ項目編集
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
  const parsed = libraryEntryFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();
  const existing = await getAdminLibraryEntryById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "ライブラリ項目が見つかりません",
    });
  }

  if (parsed.data.slug !== existing.slug) {
    const { data: slugTaken } = await supabase
      .from("library_entries")
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

  const { related, ...values } = parsed.data;
  const { data: entry, error } = await supabase
    .from("library_entries")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("library_entry", id, related);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "library_entry",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: entry });
}
