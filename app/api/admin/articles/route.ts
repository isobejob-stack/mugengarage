import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { articleFormSchema } from "@/lib/content/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminArticles } from "@/lib/content/queries";

// FR-BLOG-001: 記事一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const articles = await listAdminArticles();
  return NextResponse.json({ data: articles });
}

// FR-BLOG-001/003: 記事新規作成（下書き/公開）
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

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
  const { data: existing } = await supabase
    .from("articles")
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

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      ...parsed.data,
      published_at:
        parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error || !article) {
    return apiInternalError(error);
  }

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "article",
    targetId: article.id,
    action: "create",
  });

  return NextResponse.json({ data: article }, { status: 201 });
}
