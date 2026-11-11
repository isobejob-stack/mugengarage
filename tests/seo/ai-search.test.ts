import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  INDEXNOW_KEY,
  buildIndexNowPayload,
  submitToIndexNow,
} from "@/lib/seo/indexnow";
import { buildLlmsTxt } from "@/lib/seo/llms";
import type { SiteSettings } from "@/lib/settings/queries";

// AI検索向けの仕組み（2026-11-11）。
// - IndexNow: その日に変わったページを Bing などに知らせる（ChatGPT検索・Copilot は Bing の索引が土台）
// - llms.txt: AIがサイトを読むときの案内書き（店舗情報と今の在庫）

describe("IndexNow", () => {
  it("鍵ファイルを公開ディレクトリに同じ値で置いている（Bing はこのファイルで送信元を確かめる）", () => {
    const file = readFileSync(
      path.resolve(__dirname, `../../public/${INDEXNOW_KEY}.txt`),
      "utf8",
    );
    expect(file.trim()).toBe(INDEXNOW_KEY);
  });

  it("自サイト以外のURLを除き、重複をまとめる", () => {
    const payload = buildIndexNowPayload(
      [
        "https://shop.example/vehicles/a",
        "https://shop.example/vehicles/a",
        "https://other.example/x",
        "not a url",
      ],
      "https://shop.example",
    );
    expect(payload).toEqual({
      host: "shop.example",
      key: INDEXNOW_KEY,
      keyLocation: `https://shop.example/${INDEXNOW_KEY}.txt`,
      urlList: ["https://shop.example/vehicles/a"],
    });
  });

  it("送るURLが無ければ通信しない", async () => {
    const fetchMock = vi.fn();
    const result = await submitToIndexNow(
      [],
      fetchMock as unknown as typeof fetch,
    );
    expect(result).toEqual({ submitted: 0, status: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("llms.txt", () => {
  const settings: SiteSettings = {
    postal_code: null,
    address: "神奈川県川崎市宮前区初山1-3-2",
    phone: null,
    business_hours: "11:00〜19:00",
    closed_days: "土曜日",
    founded_year: null,
    representative_name: null,
    access_info: null,
    email: null,
    external_links: [
      {
        label: "Instagram",
        url: "https://www.instagram.com/mgarage9333/",
        description: null,
      },
    ],
    hero_image_path: null,
  };

  it("店舗情報・公式SNS・在庫（見出し入りの車名と条件）を載せ、未入力の項目は出さない", () => {
    const text = buildLlmsTxt({
      settings,
      vehicles: [
        {
          slug: "double-six-1990",
          price: 3_850_000,
          total_price: 4_050_000,
          model_year: 1990,
          mileage_km: 59100,
          accident_history: false,
          steering_side: "right",
          sales_comment: "**ダブルシックス 特注ワイヤーホイール**\n\n本文",
          manufacturers: { name: "ディムラー" },
          models: { name: "ディムラー" },
        },
        // URLの無い車は載せない
        {
          slug: null,
          price: 1,
          total_price: null,
          model_year: null,
          mileage_km: null,
          accident_history: null,
          steering_side: null,
          sales_comment: null,
          manufacturers: null,
          models: null,
        },
      ],
      generatedAt: new Date("2026-11-11T03:00:00Z"),
    });

    expect(text.startsWith("# エムガレージ（M-GARAGE）")).toBe(true);
    expect(text).toContain("神奈川県川崎市・南足柄市のジャガー・ディムラー");
    expect(text).toContain("- 所在地: 神奈川県川崎市宮前区初山1-3-2");
    expect(text).toContain("- 定休日: 土曜日");
    expect(text).toContain("https://www.instagram.com/mgarage9333/");
    expect(text).toContain("在庫車両（2026/11/11時点・1台）");
    expect(text).toContain(
      "[ディムラー ダブルシックス](https://mugengarage.vercel.app/vehicles/double-six-1990): 特注ワイヤーホイール。1990年式、走行5.9万km、支払総額405万円、修復歴なし、右ハンドル",
    );
    expect(text).not.toContain("電話:");
  });
});
