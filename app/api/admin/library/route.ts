import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { libraryEntryFormSchema } from "@/lib/library/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminLibraryEntries } from "@/lib/library/queries";
import { replaceRelatedContents } from "@/lib/related/queries";

// FR-LIB-001: ライブラリ一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const entries = await listAdminLibraryEntries();
  return NextResponse.json({ data: entries });
}

// FR-LIB-001: ライブラリ項目の新規作成（BR-DOM-002: 販売車両の有無に依存しない）
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

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
  const { data: existing } = await supabase
    .from("library_entries")
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

  const { related, ...values } = parsed.data;
  const { data: entry, error } = await supabase
    .from("library_entries")
    .insert(values)
    .select()
    .single();

  if (error || !entry) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("library_entry", entry.id, related);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "library_entry",
    targetId: entry.id,
    action: "create",
  });

  return NextResponse.json({ data: entry }, { status: 201 });
}
