import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdminMock,
  type SupabaseAdminMock,
} from "../support/supabase-admin-mock";

// 管理画面の認可（lib/api/require-admin.ts）。
//
// ここは管理系45本のRoute Handlerが全て通る1点で、その向こうには
// 顧客の氏名・電話番号・メールアドレスがある。
//
// 以前この関数は「Supabase Authのセッションがあるか」しか見ておらず、
// 「管理者か」を確認していなかった。匿名キーはブラウザに配る公開値なので、
// Supabase側でサインアップが有効なら第三者が自分で登録して全顧客情報に
// 到達できた。同じ退行を二度と通さないため、
// 「セッションはあるが admin_users に居ない」を必ず弾くことを固定する。

let supabaseMock: SupabaseAdminMock;
let currentUser: { id: string } | null = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => supabaseMock.client),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: currentUser }, error: null }),
    },
  })),
}));

// React の cache() はリクエスト単位で結果を保持するため、
// ケースごとにモジュールごと読み込み直す
async function loadModule() {
  vi.resetModules();
  return import("@/lib/api/require-admin");
}

function adminUsersRows(config: {
  data: unknown;
  error?: { message: string } | null;
}) {
  return {
    admin_users: { data: config.data, error: config.error ?? null },
  };
}

describe("管理画面の認可", () => {
  beforeEach(() => {
    currentUser = null;
    supabaseMock = createSupabaseAdminMock();
  });

  it("未ログインは管理者として扱わない", async () => {
    currentUser = null;
    supabaseMock = createSupabaseAdminMock(adminUsersRows({ data: null }));

    const { requireAdminUser, getAdminAccessState } = await loadModule();

    expect(await requireAdminUser()).toBeNull();
    expect(await getAdminAccessState()).toBe("anonymous");
  });

  it("admin_users に登録のある人だけを管理者として通す", async () => {
    currentUser = { id: "user-1" };
    supabaseMock = createSupabaseAdminMock(
      adminUsersRows({
        data: { id: "user-1", name: "磯部", role: "admin" },
      }),
    );

    const { requireAdminUser, getAdminAccessState } = await loadModule();

    expect(await requireAdminUser()).toEqual({ id: "user-1" });
    expect(await getAdminAccessState()).toBe("admin");
  });

  // 本体の退行テスト。
  // ログインはできるが管理者ではない人（Supabaseのダッシュボードから
  // 直接作られたユーザー、サインアップが開いていた場合の自己登録者）を弾く。
  it("ログイン済みでも admin_users に居なければ弾く", async () => {
    currentUser = { id: "stranger" };
    supabaseMock = createSupabaseAdminMock(adminUsersRows({ data: null }));

    const { requireAdminUser, getAdminAccessState } = await loadModule();

    expect(await requireAdminUser()).toBeNull();
    expect(await getAdminAccessState()).toBe("not_admin");
  });

  // 「エラーなら通す」に倒すと、DB障害がそのまま認可の迂回路になる。
  it("admin_users の取得に失敗したら管理者として扱わない", async () => {
    currentUser = { id: "user-1" };
    supabaseMock = createSupabaseAdminMock(
      adminUsersRows({ data: null, error: { message: "boom" } }),
    );

    const { requireAdminUser, getAdminAccessState } = await loadModule();

    expect(await requireAdminUser()).toBeNull();
    expect(await getAdminAccessState()).toBe("not_admin");
  });

  it("照会は本人のIDに限定する（他人の行で通らない）", async () => {
    currentUser = { id: "user-1" };
    supabaseMock = createSupabaseAdminMock(
      adminUsersRows({ data: { id: "user-1", name: "磯部", role: "admin" } }),
    );

    const { requireAdminUser } = await loadModule();
    await requireAdminUser();

    const eqCalls = supabaseMock
      .callsFor("admin_users")
      .filter((c) => c.method === "eq");
    expect(eqCalls).toHaveLength(1);
    expect(eqCalls[0].args).toEqual(["id", "user-1"]);
  });
});
