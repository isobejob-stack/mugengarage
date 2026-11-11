import { describe, expect, it } from "vitest";
import {
  BUSINESS_ID,
  buildBusinessGraph,
  buildOpeningHoursSpecification,
  parseBusinessHours,
  parseClosedWeekdays,
  parseJapaneseAddress,
} from "@/lib/seo/business";
import type { SiteSettings } from "@/lib/settings/queries";

// 店舗とサイトの構造化データ（2026-11-11）。
// 店舗情報は管理画面で1つの欄に自由に書かれるため、読める形だけを構造化し、
// 読めない形は推測で埋めない（誤った住所・営業時間を検索エンジンに渡さない）ことを固定する。

const SETTINGS: SiteSettings = {
  postal_code: "216-0011",
  address: "神奈川県川崎市宮前区初山1-3-2",
  phone: "090-2324-9333",
  business_hours: "11:00〜19:00",
  closed_days: "土曜日",
  founded_year: null,
  representative_name: null,
  access_info: null,
  email: "mgarage9333@outlook.jp",
  external_links: [
    {
      label: "Instagram",
      url: "https://www.instagram.com/mgarage9333/",
      description: null,
    },
    {
      label: "車選びドットコム",
      url: "https://www.kurumaerabi.com/shop/detail/14921/",
      description: null,
    },
  ],
  hero_image_path: null,
};

describe("parseJapaneseAddress", () => {
  it("政令指定都市の区まで市区町村として切り出す", () => {
    expect(parseJapaneseAddress("神奈川県川崎市宮前区初山1-3-2")).toEqual({
      region: "神奈川県",
      locality: "川崎市宮前区",
      street: "初山1-3-2",
    });
  });

  it("先頭の郵便番号は落とす", () => {
    expect(
      parseJapaneseAddress("〒216-0011 神奈川県川崎市宮前区初山1-3-2"),
    ).toMatchObject({ region: "神奈川県", locality: "川崎市宮前区" });
  });

  it("東京の区・ふつうの市", () => {
    expect(parseJapaneseAddress("東京都港区南青山1-2-3")).toMatchObject({
      region: "東京都",
      locality: "港区",
      street: "南青山1-2-3",
    });
    expect(parseJapaneseAddress("東京都町田市原町田6-1-1")).toMatchObject({
      locality: "町田市",
      street: "原町田6-1-1",
    });
  });

  it("形が読めない住所は分けずに全体を残す", () => {
    expect(parseJapaneseAddress("川崎市宮前区初山1-3-2")).toEqual({
      region: null,
      locality: null,
      street: "川崎市宮前区初山1-3-2",
    });
  });
});

describe("営業時間・定休日", () => {
  it("1日1区間の営業時間を読む（全角・「時」表記も）", () => {
    expect(parseBusinessHours("11:00〜19:00")).toEqual({
      opens: "11:00",
      closes: "19:00",
    });
    expect(parseBusinessHours("１１：００～１９：３０")).toEqual({
      opens: "11:00",
      closes: "19:30",
    });
    expect(parseBusinessHours("10時〜18時")).toEqual({
      opens: "10:00",
      closes: "18:00",
    });
  });

  it("複数区間・曜日別の書き方は読まない", () => {
    expect(parseBusinessHours("平日10:00〜19:00 土日10:00〜17:00")).toBeNull();
    expect(parseBusinessHours("要予約")).toBeNull();
  });

  it("「土曜日」の「日」を日曜日と取り違えない", () => {
    expect(parseClosedWeekdays("土曜日")).toEqual(new Set(["土"]));
    expect(parseClosedWeekdays("毎週土曜日")).toEqual(new Set(["土"]));
  });

  it("祝日は曜日として数えない", () => {
    expect(parseClosedWeekdays("土日祝")).toEqual(new Set(["土", "日"]));
    expect(parseClosedWeekdays("祝日")).toBeNull();
  });

  it("曜日の一覧で表せない休みは読まない", () => {
    expect(parseClosedWeekdays("不定休")).toBeNull();
    expect(parseClosedWeekdays("第2・第4火曜日")).toBeNull();
    expect(parseClosedWeekdays("年末年始")).toBeNull();
  });

  it("年中無休は休みなし", () => {
    expect(parseClosedWeekdays("年中無休")).toEqual(new Set());
  });

  it("営業時間と定休日がどちらも読めたときだけ、曜日ごとの営業時間にする", () => {
    const spec = buildOpeningHoursSpecification("11:00〜19:00", "土曜日");
    expect(spec).toHaveLength(1);
    expect(spec?.[0].dayOfWeek).toHaveLength(6);
    expect(spec?.[0].dayOfWeek).not.toContain("https://schema.org/Saturday");
    expect(spec?.[0]).toMatchObject({ opens: "11:00", closes: "19:00" });

    expect(buildOpeningHoursSpecification("11:00〜19:00", null)).toBeNull();
    expect(buildOpeningHoursSpecification("11:00〜19:00", "不定休")).toBeNull();
  });
});

describe("buildBusinessGraph", () => {
  it("販売店かつ整備工場として、店舗情報と公式SNS・掲載媒体を1つの実体にまとめる", () => {
    const graph = buildBusinessGraph({
      settings: SETTINGS,
      heroImageUrl: null,
    });
    const [business, website] = graph["@graph"] as Array<
      Record<string, unknown>
    >;

    expect(business["@type"]).toEqual(["AutoDealer", "AutoRepair"]);
    expect(business["@id"]).toBe(BUSINESS_ID);
    expect(business.alternateName).toContain("M-GARAGE");
    expect(business.address).toEqual({
      "@type": "PostalAddress",
      addressCountry: "JP",
      postalCode: "216-0011",
      addressRegion: "神奈川県",
      addressLocality: "川崎市宮前区",
      streetAddress: "初山1-3-2",
    });
    expect(business.telephone).toBe("090-2324-9333");
    expect(business.sameAs).toEqual([
      "https://www.instagram.com/mgarage9333/",
      "https://www.kurumaerabi.com/shop/detail/14921/",
    ]);
    expect(business.openingHoursSpecification).toBeDefined();

    // サイト名（検索結果に出る名前）とその発行元
    expect(website["@type"]).toBe("WebSite");
    expect(website.name).toBe("エムガレージ");
    expect(website.publisher).toEqual({ "@id": BUSINESS_ID });
  });

  it("未入力の店舗情報は項目ごと出さない", () => {
    const graph = buildBusinessGraph({
      settings: {
        ...SETTINGS,
        address: null,
        phone: null,
        email: null,
        business_hours: null,
        external_links: [],
      },
      heroImageUrl: null,
    });
    const business = (graph["@graph"] as Array<Record<string, unknown>>)[0];

    expect(business).not.toHaveProperty("address");
    expect(business).not.toHaveProperty("hasMap");
    expect(business).not.toHaveProperty("telephone");
    expect(business).not.toHaveProperty("email");
    expect(business).not.toHaveProperty("openingHoursSpecification");
    expect(business).not.toHaveProperty("sameAs");
  });
});
