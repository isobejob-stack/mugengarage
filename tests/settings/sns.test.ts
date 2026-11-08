import { describe, expect, it } from "vitest";
import { findInstagramContact, parseInstagramUrl } from "@/lib/settings/sns";
import { buildMailtoUrl } from "@/lib/settings/mailto";
import { siteSettingsFormSchema } from "@/lib/settings/schema";

// 問い合わせ窓口（2026-11-08、店主の判断）: InstagramのDMに統一し、
// 使っていない人のために電話・メールを添える。
//
// 店主から共有されたURL（アプリの共有メニューから取ったもので、追跡用のパラメータが付いている）を
// そのまま「掲載媒体・公式SNS」に貼っても、正しい問い合わせ先になることを固定する。

const SHARED_INSTAGRAM_URL =
  "https://www.instagram.com/mgarage9333?obrf=MWUxYjBsN3drd28yOQ==";

describe("parseInstagramUrl", () => {
  it("共有メニューのURLからアカウント名を取り出し、DM画面のURLを組み立てる", () => {
    expect(parseInstagramUrl(SHARED_INSTAGRAM_URL)).toEqual({
      username: "mgarage9333",
      profileUrl: "https://www.instagram.com/mgarage9333/",
      dmUrl: "https://ig.me/m/mgarage9333",
    });
  });

  it("末尾のスラッシュや www の有無に左右されない", () => {
    expect(
      parseInstagramUrl("https://instagram.com/mgarage9333/")?.username,
    ).toBe("mgarage9333");
  });

  it("投稿やリールのURLはアカウントとして扱わない", () => {
    expect(parseInstagramUrl("https://www.instagram.com/p/ABC123/")).toBeNull();
    expect(
      parseInstagramUrl("https://www.instagram.com/reel/ABC123/"),
    ).toBeNull();
    expect(parseInstagramUrl("https://www.instagram.com/")).toBeNull();
  });

  it("Instagram以外のURLや壊れたURLは対象外", () => {
    expect(
      parseInstagramUrl("https://www.threads.com/@mgarage9333"),
    ).toBeNull();
    expect(
      parseInstagramUrl("https://evil.example/instagram.com/x"),
    ).toBeNull();
    expect(
      parseInstagramUrl("https://instagram.com.evil.example/mgarage9333"),
    ).toBeNull();
    expect(parseInstagramUrl("not a url")).toBeNull();
  });
});

describe("findInstagramContact", () => {
  it("掲載媒体・公式SNSの一覧からInstagramを見つける（他の媒体は無視する）", () => {
    const contact = findInstagramContact([
      {
        label: "車選びドットコム",
        url: "https://www.kurumaerabi.com/shop/detail/14921/",
        description: null,
      },
      { label: "Instagram", url: SHARED_INSTAGRAM_URL, description: null },
    ]);

    expect(contact?.dmUrl).toBe("https://ig.me/m/mgarage9333");
  });

  it("登録が無ければ null（問い合わせボタンを出さない）", () => {
    expect(findInstagramContact([])).toBeNull();
  });
});

describe("buildMailtoUrl", () => {
  it("件名と本文の書き出しを入れたメールリンクを作る", () => {
    const url = buildMailtoUrl(
      "mgarage9333@outlook.jp",
      "ジャガー XJ XJ6-3.2 1994年について",
      "https://mugengarage.vercel.app/vehicles/xj6-3-2-1994-135\n\n",
    );
    expect(url.startsWith("mailto:mgarage9333@outlook.jp?")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("ジャガー XJ XJ6-3.2 1994年について");
    expect(params.get("body")).toBe(
      "https://mugengarage.vercel.app/vehicles/xj6-3-2-1994-135\n\n",
    );
    // 空白は「+」ではなく %20（メールアプリによっては「+」がそのまま出るため）
    expect(url).not.toContain("+");
  });

  it("件名も本文も無ければアドレスだけ", () => {
    expect(buildMailtoUrl("info@example.com")).toBe("mailto:info@example.com");
  });
});

describe("店舗情報のメールアドレス", () => {
  const base = {
    postal_code: "",
    address: "",
    phone: "",
    business_hours: "",
    closed_days: "",
    founded_year: "",
    representative_name: "",
    access_info: "",
    external_links: [],
  };

  it("空欄は未設定（null）として保存する", () => {
    const parsed = siteSettingsFormSchema.parse({ ...base, email: "" });
    expect(parsed.email).toBeNull();
  });

  it("メールアドレスの形でなければ保存しない", () => {
    expect(
      siteSettingsFormSchema.safeParse({ ...base, email: "mgarage9333" })
        .success,
    ).toBe(false);
    expect(
      siteSettingsFormSchema.parse({ ...base, email: " info@example.com " })
        .email,
    ).toBe("info@example.com");
  });
});
