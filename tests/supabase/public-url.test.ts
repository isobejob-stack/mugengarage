import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { getStoragePublicUrl } from "@/lib/supabase/public-url";

// 公開バケットのURL組み立て（lib/supabase/public-url.ts）。
//
// 写真1枚ごとにSupabaseクライアントを生成していたのをやめ、
// @supabase/storage-js と同じ規則で文字列を組み立てるようにした。
// 出力が1文字でもずれると写真が全滅するため、本家の getPublicUrl と
// 同じ結果になることを実際に突き合わせて確かめる。

const SUPABASE_URL = "https://abcdefghij.supabase.co";
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function referenceUrl(bucket: string, path: string) {
  // ダミーの publishable key。URLの組み立てにはキーの中身は使われない
  const client = createClient(SUPABASE_URL, `sb_publishable_${"x".repeat(30)}`);
  return client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

describe("getStoragePublicUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  });

  it.each([
    ["vehicle-photos", "0d0c9c8f-1111-2222-3333-444455556666/abc-def.jpg"],
    ["site-assets", "hero/9f9f9f9f-aaaa-bbbb-cccc-dddddddddddd.png"],
    // 先頭のスラッシュは storage-js 側でも落とされる（`//` は別パス扱いになるため）
    ["site-assets", "/leading/slash.jpg"],
    // 日本語や空白を含むファイル名でもエスケープの仕方が一致すること
    ["vehicle-photos", "folder with space/写真 1.jpg"],
  ])("supabase-js の getPublicUrl と一致する（%s / %s）", (bucket, path) => {
    expect(getStoragePublicUrl(bucket, path)).toBe(referenceUrl(bucket, path));
  });

  it("末尾にスラッシュが付いた設定値でもURLが二重にならない", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = `${SUPABASE_URL}/`;

    expect(getStoragePublicUrl("site-assets", "hero/a.png")).toBe(
      `${SUPABASE_URL}/storage/v1/object/public/site-assets/hero/a.png`,
    );
  });

  it("接続先が未設定なら、どの環境変数が足りないかを名指しで知らせる", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => getStoragePublicUrl("site-assets", "hero/a.png")).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});
