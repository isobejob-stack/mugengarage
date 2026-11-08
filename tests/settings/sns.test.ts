import { describe, expect, it } from "vitest";
import {
  findSnsContacts,
  parseInstagramUrl,
  parseThreadsUrl,
} from "@/lib/settings/sns";

// 公式SNSへの問い合わせ導線（lib/settings/sns.ts）。
// 店主から共有されたURL（アプリの共有メニューから取ったもので、追跡用のパラメータが付いている）を
// そのまま「掲載媒体・公式SNS」に貼っても、正しい問い合わせ先になることを固定する。

const SHARED_INSTAGRAM_URL =
  "https://www.instagram.com/mgarage9333?obrf=MWUxYjBsN3drd28yOQ==";
const SHARED_THREADS_URL =
  "https://www.threads.com/@mgarage9333?igshid=NTc4MTIwNjQ2YQ==";

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
    expect(parseInstagramUrl("not a url")).toBeNull();
  });
});

describe("parseThreadsUrl", () => {
  it("共有メニューのURLからアカウント名を取り出す", () => {
    expect(parseThreadsUrl(SHARED_THREADS_URL)).toEqual({
      username: "mgarage9333",
      profileUrl: "https://www.threads.com/@mgarage9333",
    });
  });

  it("旧ドメイン threads.net のURLも受け付ける", () => {
    expect(
      parseThreadsUrl("https://www.threads.net/@mgarage9333")?.username,
    ).toBe("mgarage9333");
  });

  it("@ で始まらないパスはアカウントとして扱わない", () => {
    expect(parseThreadsUrl("https://www.threads.com/search")).toBeNull();
  });
});

describe("findSnsContacts", () => {
  it("掲載媒体・公式SNSの一覧からInstagramとThreadsを見つける", () => {
    const contacts = findSnsContacts([
      {
        label: "車選びドットコム",
        url: "https://www.kurumaerabi.com/shop/detail/14921/",
        description: null,
      },
      { label: "Instagram", url: SHARED_INSTAGRAM_URL, description: null },
      { label: "Threads", url: SHARED_THREADS_URL, description: null },
    ]);

    expect(contacts.instagram?.dmUrl).toBe("https://ig.me/m/mgarage9333");
    expect(contacts.threads?.profileUrl).toBe(
      "https://www.threads.com/@mgarage9333",
    );
  });

  it("登録が無ければ両方とも null（問い合わせボタンを出さない）", () => {
    expect(findSnsContacts([])).toEqual({ instagram: null, threads: null });
  });
});
