import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

// 画面の固定文言をDBから読む。
//
// 全ページのヘッダー・フッター・見出しから参照されるため、
// 1リクエスト1クエリに抑える（cache）。件数は多くても数十行のため全件読みでよい。
//
// テーブルが無い場合（マイグレーション未適用）や一時的なDB障害では空として扱う。
// 文言はコード側に既定値があるので、空でも画面は今までどおり表示される。
// 補助的な情報のためにサイト全体を止めない、という lib/settings/queries.ts と同じ方針。
export const getSiteTexts = cache(
  async (): Promise<Map<string, string>> => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("site_texts")
        .select("key, value");

      if (error) return new Map();

      return new Map(
        (data ?? []).map((row) => [row.key as string, row.value as string]),
      );
    } catch {
      return new Map();
    }
  },
);
