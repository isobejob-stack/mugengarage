import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdminMock,
  type SupabaseAdminMock,
} from "../support/supabase-admin-mock";

// 旧URL→新URLの引き当てキャッシュ（lib/seo/redirect-lookup.ts）。
//
// この処理は proxy.ts から公開ページへの全アクセスで通る。
// 以前はアクセス1回ごとにredirectsテーブルへ問い合わせており、
// ほぼ必ず空振りする検索のためにサイト全体へDB1往復ぶんの待ち時間が乗っていた。
// 「引き当ての結果は変えずに、往復だけを減らす」のがこのキャッシュの目的なので、
// 引き当ての正しさと、キャッシュが効いていること、障害時に壊れないことを担保する。

let supabaseMock: SupabaseAdminMock;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => supabaseMock.client),
}));

// モジュールスコープにキャッシュを持つため、テストごとに読み込み直す
async function loadModule() {
  vi.resetModules();
  return import("@/lib/seo/redirect-lookup");
}

function redirectRows(rows: Array<[string, string]>) {
  return {
    redirects: {
      data: rows.map(([old_path, new_path]) => ({ old_path, new_path })),
      error: null,
    },
  };
}

function selectCount() {
  return supabaseMock.callsFor("redirects").filter((c) => c.method === "select")
    .length;
}

describe("findRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("登録済みの旧URLには新しいURLを返し、未登録のURLにはnullを返す", async () => {
    supabaseMock = createSupabaseAdminMock(
      redirectRows([["/vehicles/old-slug", "/vehicles/new-slug"]]),
    );
    const { findRedirect } = await loadModule();

    await expect(findRedirect("/vehicles/old-slug")).resolves.toBe(
      "/vehicles/new-slug",
    );
    await expect(findRedirect("/vehicles/new-slug")).resolves.toBeNull();
    await expect(findRedirect("/")).resolves.toBeNull();
  });

  it("2回目以降の引き当てではDBを読み直さない", async () => {
    supabaseMock = createSupabaseAdminMock(
      redirectRows([
        ["/a", "/b"],
        ["/c", "/d"],
      ]),
    );
    const { findRedirect } = await loadModule();

    await findRedirect("/a");
    await findRedirect("/c");
    await findRedirect("/未登録");

    expect(selectCount()).toBe(1);
  });

  it("同時に来たリクエストでも読み込みは1回にまとめる", async () => {
    supabaseMock = createSupabaseAdminMock(redirectRows([["/a", "/b"]]));
    const { findRedirect } = await loadModule();

    const results = await Promise.all([
      findRedirect("/a"),
      findRedirect("/a"),
      findRedirect("/x"),
    ]);

    expect(results).toEqual(["/b", "/b", null]);
    expect(selectCount()).toBe(1);
  });

  it("TTLを過ぎると読み直す", async () => {
    vi.useFakeTimers();
    supabaseMock = createSupabaseAdminMock(redirectRows([["/a", "/b"]]));
    const { findRedirect } = await loadModule();

    await findRedirect("/a");
    expect(selectCount()).toBe(1);

    vi.advanceTimersByTime(61_000);
    await findRedirect("/a");
    expect(selectCount()).toBe(2);
  });

  it("登録直後に無効化すると、TTLを待たずに読み直す", async () => {
    supabaseMock = createSupabaseAdminMock(redirectRows([["/a", "/b"]]));
    const { findRedirect, invalidateRedirectCache } = await loadModule();

    await findRedirect("/a");
    invalidateRedirectCache();
    await findRedirect("/a");

    expect(selectCount()).toBe(2);
  });

  it("読み込みに失敗しても、直前まで持っていた内容で引き当てを続ける", async () => {
    let failing = false;
    supabaseMock = createSupabaseAdminMock({
      redirects: () =>
        failing
          ? { data: null, error: { message: "connection refused" } }
          : { data: [{ old_path: "/a", new_path: "/b" }], error: null },
    });
    const { findRedirect, invalidateRedirectCache } = await loadModule();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(findRedirect("/a")).resolves.toBe("/b");

    failing = true;
    invalidateRedirectCache();

    await expect(findRedirect("/a")).resolves.toBe("/b");
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("一度も読めていない状態で失敗したときは、リダイレクトなしとして扱う", async () => {
    supabaseMock = createSupabaseAdminMock({
      redirects: { data: null, error: { message: "connection refused" } },
    });
    const { findRedirect } = await loadModule();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(findRedirect("/a")).resolves.toBeNull();

    consoleError.mockRestore();
  });

  it("DB障害が続くあいだ、読み込みの再挑戦は間隔を空けて行う", async () => {
    vi.useFakeTimers();
    supabaseMock = createSupabaseAdminMock({
      redirects: { data: null, error: { message: "connection refused" } },
    });
    const { findRedirect } = await loadModule();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // 落ちている相手に毎リクエスト読みに行かない（＝全ページに失敗の待ち時間を乗せない）
    for (let i = 0; i < 5; i++) await findRedirect("/a");
    expect(selectCount()).toBe(1);

    vi.advanceTimersByTime(6_000);
    await findRedirect("/a");
    expect(selectCount()).toBe(2);

    consoleError.mockRestore();
  });
});
