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

// /jaguar の年表導線用。件数と、最初・最後の年だけを返す。
//
// 「1922年から2024年まで59件」という規模そのものが年表へ進む理由になるが、
// そのために59件の本文まで読み込む必要はないので、日付だけを取る。
// 年号はDBの値をそのまま使う（読み物側で年号を書き起こさないための措置。
// docs/tasks/CONTENT_FACTCHECK.md）。
export async function getPublicTimelineSpan() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("timeline_events")
    .select("event_date")
    .is("deleted_at", null)
    .order("event_date", { ascending: true });

  const rows = (data ?? []) as Array<{ event_date: string }>;
  if (rows.length === 0) return null;

  const yearOf = (date: string) => Number(date.slice(0, 4));
  return {
    count: rows.length,
    firstYear: yearOf(rows[0].event_date),
    lastYear: yearOf(rows[rows.length - 1].event_date),
  };
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
