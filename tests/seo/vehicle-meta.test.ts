import { describe, expect, it } from "vitest";
import {
  buildVehicleName,
  extractListingHeadline,
  formatManYen,
} from "@/lib/inventory/display";
import {
  buildVehicleListDescription,
  buildVehicleMetaDescription,
  buildVehiclePageTitle,
} from "@/lib/seo/vehicle-meta";
import { buildVehicleStructuredData } from "@/lib/seo/structured-data";
import { BUSINESS_ID } from "@/lib/seo/business";
import { buildVehicleRecord } from "../support/vehicle-fixtures";

// 車両ページのタイトル・説明文・構造化データ（2026-11-11）。
//
// 車選びドットコムから取り込んだ車は、車名が「ディムラー ディムラー」のように登録されており
// （店主の指示で掲載の表記のまま）、探す人の言葉（ダブルシックス・XJ6）は販売コメント1行目の
// 見出しにしか無い。見出しをタイトルに使うこと、説明文に Markdown の記号を出さないことを固定する。

const DOUBLE_SIX = buildVehicleRecord({
  model_year: 1990,
  mileage_km: 59100,
  price: 3_850_000,
  total_price: 4_050_000,
  accident_history: false,
  steering_side: "right",
  shaken_status: "inspection_included",
  sales_comment:
    "**ダブルシックス 特注ワイヤーホイール**\n\nガンメタのボディに特注のワイヤーホイールを合わせた一台です。",
});

const daimler = {
  ...DOUBLE_SIX,
  manufacturers: { name: "ディムラー" },
  models: { name: "ディムラー" },
};

describe("掲載の見出し", () => {
  it("販売コメント1行目の太字を見出しとして取り出し、末尾の読点を落とす", () => {
    expect(extractListingHeadline("**XJ6-3.2 ワンオーナー車、**\n\n本文")).toBe(
      "XJ6-3.2 ワンオーナー車",
    );
  });

  it("太字で始まらないコメントには見出しが無い", () => {
    expect(extractListingHeadline("ワンオーナーの一台です。")).toBeNull();
    expect(extractListingHeadline(null)).toBeNull();
  });

  it("見出しが無ければグレード名を使う", () => {
    expect(
      buildVehicleName({
        manufacturers: { name: "ジャガー" },
        models: { name: "XJ" },
        grades: { name: "ソブリン" },
        sales_comment: null,
      }),
    ).toBe("ジャガー XJ ソブリン");
  });
});

describe("車両ページのタイトル・説明文", () => {
  it("タイトルに見出し（ダブルシックス）と年式が入る", () => {
    expect(buildVehiclePageTitle(daimler)).toBe(
      "ディムラー ディムラー ダブルシックス 特注ワイヤーホイール（1990年式）",
    );
  });

  it("説明文は年式・走行距離・支払総額などの事実から始まり、Markdownの記号を含まない", () => {
    const description = buildVehicleMetaDescription(daimler);
    expect(
      description.startsWith("1990年式 ディムラー ディムラー ダブルシックス"),
    ).toBe(true);
    expect(description).toContain("走行5.9万km");
    expect(description).toContain("支払総額405万円（車両本体385万円）");
    expect(description).toContain("修復歴なし");
    expect(description).toContain("右ハンドル");
    expect(description).toContain("エムガレージの在庫車両です。");
    expect(description).not.toContain("**");
  });

  it("在庫一覧の説明文は、いまの在庫の台数・車種・年式から作る", () => {
    const description = buildVehicleListDescription([
      { model_year: 1993, models: { name: "XJ" } },
      { model_year: 1995, models: { name: "XJ" } },
      { model_year: 1990, models: { name: "ディムラー" } },
    ]);
    expect(description).toContain("在庫車両3台");
    expect(description).toContain("XJ・ディムラーなど");
    expect(description).toContain("1990〜1995年式");
  });

  it("万円の表記", () => {
    expect(formatManYen(4_100_000)).toBe("410万円");
    expect(formatManYen(4_055_000)).toBe("405.5万円");
  });
});

describe("車両の構造化データ", () => {
  it("価格は支払総額、売り手は全ページ共通の事業者、中古車であることを示す", () => {
    const data = buildVehicleStructuredData({
      vehicle: daimler,
      name: buildVehiclePageTitle(daimler),
      description: null,
      images: [],
      url: "https://example.com/vehicles/x",
    });

    expect(data.itemCondition).toBe("https://schema.org/UsedCondition");
    expect(data.steeringPosition).toBe("https://schema.org/RightHandDriving");
    const offers = data.offers as Record<string, unknown>;
    expect(offers.price).toBe(4_050_000);
    expect((offers.seller as Record<string, unknown>)["@id"]).toBe(BUSINESS_ID);
  });

  it("支払総額が未確定なら本体価格", () => {
    const data = buildVehicleStructuredData({
      vehicle: { ...daimler, total_price: null },
      name: "x",
      description: null,
      images: [],
      url: "https://example.com/vehicles/x",
    });
    expect((data.offers as Record<string, unknown>).price).toBe(3_850_000);
  });
});
