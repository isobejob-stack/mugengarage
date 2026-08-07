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

// ISSUE-004課題1 / BR-DEL-002: 論理削除された年表イベントの一覧（管理画面の「削除済み」タブ・復元用）
export async function listDeletedTimelineEvents() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (data ?? []) as TimelineEvent[];
}

// ISSUE-004課題1 / BR-DEL-002: 復元対象の存在チェック用（論理削除済みのものだけを対象にする）
export async function getDeletedTimelineEventById(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("*")
    .eq("id", id)
    .not("deleted_at", "is", null)
    .maybeSingle<TimelineEvent>();

  return data;
}

// ISSUE-004課題1 / BR-DEL-002: 論理削除された年表イベントの復元（deleted_atをnullに戻す）
export async function restoreTimelineEvent(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("timeline_events")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  return { data: data as TimelineEvent | null, error };
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
