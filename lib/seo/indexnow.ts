import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-config";

// IndexNow: 新しく出た・変わった・消えたページを、検索エンジンにその日のうちに知らせる仕組み（2026-11-11）。
//
// Bing（と Yandex・Naver など）が対応している。ChatGPT の検索と Microsoft Copilot は
// Bing の索引を土台にしているため、在庫の入れ替えを Bing に早く伝えることが、
// AI検索の回答に今の在庫が出るかどうかに直結する。Google は IndexNow に対応していない
// （Google にはサイトマップと Search Console で伝わる）。
//
// 鍵は秘密ではない（送信元のサイトだと証明するために、同じ値を公開ファイルに置く仕組み）。
// public/<鍵>.txt に同じ値を置いてある。鍵を変えるときは両方を変える。
export const INDEXNOW_KEY = "ee1ad0ddec678a2c67e05ac58403220e";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// 1回の送信で受け付けられる上限（IndexNow の仕様）
const MAX_URLS_PER_REQUEST = 10000;

export function buildIndexNowPayload(urls: string[], siteUrl = SITE_URL) {
  const host = new URL(siteUrl).host;
  const urlList = [...new Set(urls)]
    .filter((url) => {
      try {
        return new URL(url).host === host;
      } catch {
        return false;
      }
    })
    .slice(0, MAX_URLS_PER_REQUEST);

  return {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
    urlList,
  };
}

export async function submitToIndexNow(
  urls: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ submitted: number; status: number | null }> {
  const payload = buildIndexNowPayload(urls);
  if (payload.urlList.length === 0) return { submitted: 0, status: null };

  const response = await fetchImpl(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });
  // 200: 受理 / 202: 受理（鍵の確認待ち） / 4xx: 鍵や URL の不備。どれも呼び出し側でログに残すだけにする
  return { submitted: payload.urlList.length, status: response.status };
}

// 指定時刻以降に変わった公開ページのURLを集める。
// 売約・削除で非公開になった車両のURLも含める（検索エンジンに「もう無い」と早く気づかせるため）。
export async function collectChangedUrls(since: Date): Promise<string[]> {
  const supabase = createAdminClient();
  const sinceIso = since.toISOString();

  const [vehicles, archives, articles, encyclopedia, library] =
    await Promise.all([
      // 下書きのまま変わった車両は、もともと公開されていないURLなので知らせない
      supabase
        .from("vehicles")
        .select("id")
        .in("status", ["published", "sold", "negotiating"])
        .gte("updated_at", sinceIso),
      supabase
        .from("owner_archive_entries")
        .select("vehicle_id")
        .eq("is_published", true)
        .is("deleted_at", null)
        .gte("updated_at", sinceIso),
      supabase
        .from("articles")
        .select("slug")
        .or("status.eq.published,deleted_at.not.is.null")
        .gte("updated_at", sinceIso),
      supabase
        .from("encyclopedia_entries")
        .select("slug")
        .gte("updated_at", sinceIso),
      supabase
        .from("library_entries")
        .select("slug")
        .gte("updated_at", sinceIso),
    ]);

  const urls: string[] = [];

  const vehicleIds = (vehicles.data ?? []).map((v) => v.id as string);
  if (vehicleIds.length > 0) {
    const { data: slugs } = await supabase
      .from("seo_metas")
      .select("slug")
      .eq("target_type", "vehicle")
      .in("target_id", vehicleIds);
    for (const s of slugs ?? []) urls.push(`${SITE_URL}/vehicles/${s.slug}`);
    // 在庫が動けば、トップと在庫一覧の中身も変わる
    urls.push(`${SITE_URL}/`, `${SITE_URL}/vehicles`);
  }
  for (const a of archives.data ?? []) {
    urls.push(`${SITE_URL}/owners-archive/${a.vehicle_id}`);
  }
  if ((articles.data ?? []).length > 0) urls.push(`${SITE_URL}/blog`);
  for (const a of articles.data ?? []) urls.push(`${SITE_URL}/blog/${a.slug}`);
  for (const e of encyclopedia.data ?? []) {
    urls.push(`${SITE_URL}/encyclopedia/${e.slug}`);
  }
  for (const l of library.data ?? [])
    urls.push(`${SITE_URL}/library/${l.slug}`);

  return [...new Set(urls)];
}
