import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TimelineEvent } from "@/lib/knowledge/types";

// FR-TL-001: 管理画面の年表一覧（論理削除除く、新しい日付順）
export async function listAdminTimelineEvents() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("*")
    .is("deleted_at", null)
    .order("event_date", { ascending: false });

  return (data ?? []) as TimelineEvent[];
}

export async function getAdminTimelineEventById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<TimelineEvent>();

  return data;
}

// FR-TL-002: 公開年表（時系列昇順、BR-DOM-003: 特定車両インスタンスに依存しない）
export async function listPublicTimelineEvents() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("*")
    .is("deleted_at", null)
    .order("event_date", { ascending: true });

  return (data ?? []) as TimelineEvent[];
}
