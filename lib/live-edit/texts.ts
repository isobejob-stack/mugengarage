import "server-only";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS } from "@/lib/cache/tags";

// 画面の固定文言をDBから読む。
//
// 全ページのヘッダー・フッター・見出しから参照されるため、
// 1リクエスト1クエリに抑える（cache）。件数は多くても数十行のため全件読みでよい。
//
// テーブルが無い場合（マイグレーション未適用）や一時的なDB障害では空として扱う。
// 文言はコード側に既定値があるので、空でも画面は今までどおり表示される。
// 補助的な情報のためにサイト全体を止めない、という lib/settings/queries.ts と同じ方針。
async function fetchSiteTexts(): Promise<Array<[string, string]>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_texts")
      .select("key, value");

    if (error) return [];

    return (data ?? []).map(
      (row) => [row.key as string, row.value as string] as [string, string],
    );
  } catch {
    return [];
  }
}

// リクエストをまたいで持ち回るキャッシュ。
// 画面文言は店主がライブ編集で直したときにしか変わらないのに、
// 全ページ・全リクエストで読み直していた。
//
// Map はキャッシュの保存形式（JSON）にそのまま載らないため、
// 保存するのは [key, value] の配列にして、読み出し側でMapへ戻す。
const getCachedSiteTexts = unstable_cache(fetchSiteTexts, ["site-texts"], {
  tags: [CACHE_TAGS.siteTexts],
  revalidate: 3600,
});

export const getSiteTexts = cache(async (): Promise<Map<string, string>> => {
  return new Map(await getCachedSiteTexts());
});

// ライブ編集で文言を書き換えた側から呼ぶ。
// expire: 0 の理由は lib/settings/queries.ts の revalidateSiteSettings と同じで、
// 「直した本人が公開サイトを開いたときに古い文言が見える」のを避けるため。
export function revalidateSiteTexts() {
  revalidateTag(CACHE_TAGS.siteTexts, { expire: 0 });
}
