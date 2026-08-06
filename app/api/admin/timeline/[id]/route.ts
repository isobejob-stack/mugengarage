import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { timelineEventFormSchema } from "@/lib/timeline/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { getAdminTimelineEventById } from "@/lib/timeline/queries";
import {
  listRelatedContents,
  replaceRelatedContents,
} from "@/lib/related/queries";

// FR-TL-001: 年表イベント詳細取得（管理用、関連コンテンツ含む）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const { id } = await params;
  const event = await getAdminTimelineEventById(id);
  if (!event) {
    return apiError({
      code: "NOT_FOUND",
      message: "年表イベントが見つかりません",
    });
  }

  const related = await listRelatedContents("timeline_event", id);
  return NextResponse.json({ data: { ...event, related } });
}

// FR-TL-001: 年表イベント編集
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
  const parsed = timelineEventFormSchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return apiError({
      code: "VALIDATION_ERROR",
      message: first.message,
      field: first.path.join("."),
    });
  }

  const existing = await getAdminTimelineEventById(id);
  if (!existing) {
    return apiError({
      code: "NOT_FOUND",
      message: "年表イベントが見つかりません",
    });
  }

  const { related, ...values } = parsed.data;
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("timeline_events")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error || !event) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("timeline_event", id, related);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "timeline_event",
    targetId: id,
    action: "update",
  });

  return NextResponse.json({ data: event });
}
