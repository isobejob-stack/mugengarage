import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/api/require-admin";
import { apiError, apiInternalError } from "@/lib/api/error-response";
import { timelineEventFormSchema } from "@/lib/timeline/schema";
import { recordAuditLog } from "@/lib/audit/log";
import { listAdminTimelineEvents } from "@/lib/timeline/queries";
import { replaceRelatedContents } from "@/lib/related/queries";

// FR-TL-001: 年表一覧取得（管理用）
export async function GET() {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

  const events = await listAdminTimelineEvents();
  return NextResponse.json({ data: events });
}

// FR-TL-001: 年表イベントの新規作成
export async function POST(request: NextRequest) {
  const user = await requireAdminUser();
  if (!user) {
    return apiError({ code: "UNAUTHORIZED", message: "ログインが必要です" });
  }

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

  const { related, ...values } = parsed.data;
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("timeline_events")
    .insert(values)
    .select()
    .single();

  if (error || !event) {
    return apiInternalError(error);
  }

  await replaceRelatedContents("timeline_event", event.id, related);

  await recordAuditLog({
    adminUserId: user.id,
    targetType: "timeline_event",
    targetId: event.id,
    action: "create",
  });

  return NextResponse.json({ data: event }, { status: 201 });
}
