import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { articleFormSchema } from "@/lib/content/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminArticleById } from "@/lib/content/queries";

// FR-BLOG-001: 記事詳細取得（管理用、編集フォームの初期値）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const article = await getAdminArticleById(id);
  if (!article) {
    return apiError({ code: "NOT_FOUND", message: "記事が見つかりません" });
  }

  return NextResponse.json({ data: article });
}

// FR-BLOG-001: 記事編集
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
  const parsed = articleFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const supabase = createAdminClient();

  const existing = await getAdminArticleById(id);
  if (!existing) {
    return apiError({ code: "NOT_FOUND", message: "記事が見つかりません" });
  }

  if (parsed.data.slug !== existing.slug) {
    const { data: slugTaken } = await supabase
      .from("articles")
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

  const nowPublishing =
    existing.status !== "published" && parsed.data.status === "published";

  const { data: article, error } = await supabase
    .from("articles")
    .update({
      ...parsed.data,
      published_at: nowPublishing
        ? new Date().toISOString()
        : existing.published_at,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !article) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "article",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: article });
}
