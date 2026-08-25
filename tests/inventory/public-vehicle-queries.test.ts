import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdminMock,
  type SupabaseAdminMock,
} from "../support/supabase-admin-mock";

// トップページ／ジャガーを知る が使う公開向けクエリ。
//
// どちらのページも以前は「公開中の車両を全件・全列で読んでから、必要な分だけ使う」
// 作りだった。表示に使わない車両の諸元やslugまで毎リクエスト運んでいたため、
// 必要なぶんだけを読む関数に分けた。
// ここでは「DBに何を要求しているか」を固定して、全件読みへの逆戻りを防ぐ。

let supabaseMock: SupabaseAdminMock;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => supabaseMock.client),
}));

const {
  listPublicVehiclePreview,
  attachVehicleSlugs,
  getPublicVehicleStockSummary,
} = await import("@/lib/inventory/queries");

describe("listPublicVehiclePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("先頭N台だけを読み、総台数はDBに数えさせる", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [{ id: "v1" }, { id: "v2" }],
        error: null,
        count: 27,
      },
      seo_metas: { data: [], error: null },
    });

    const { vehicles, totalCount } = await listPublicVehiclePreview(9);

    expect(vehicles).toHaveLength(2);
    // 総台数は取得した行数ではなく、DBが数えた件数
    expect(totalCount).toBe(27);
    expect(supabaseMock.callsFor("vehicles")).toContainEqual(
      expect.objectContaining({ method: "range", args: [0, 8] }),
    );
    expect(supabaseMock.callsFor("vehicles")).toContainEqual(
      expect.objectContaining({
        method: "select",
        args: [expect.any(String), { count: "exact" }],
      }),
    );
  });

  it("公開中・論理削除されていない車両を掲載順に返す", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: [], error: null, count: 0 },
    });

    await listPublicVehiclePreview(9);

    const calls = supabaseMock.callsFor("vehicles");
    expect(calls).toContainEqual(
      expect.objectContaining({ method: "eq", args: ["status", "published"] }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({ method: "is", args: ["deleted_at", null] }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "order",
        args: ["display_order", { ascending: true }],
      }),
    );
  });

  // slugの結合はこの関数の外に出してある。呼び出し側が「slug」と「写真」を
  // 同時に走らせられるようにするため（中で待つと直列の段が1つ増える）。
  it("slugは結合せず、車両IDが分かった時点で返す", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [{ id: "v1" }, { id: "v2" }],
        error: null,
        count: 2,
      },
    });

    const { vehicles } = await listPublicVehiclePreview(9);

    expect(vehicles.map((v) => v.id)).toEqual(["v1", "v2"]);
    expect(supabaseMock.callsFor("seo_metas")).toHaveLength(0);
  });

  it("在庫が無いときも総件数を返す", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: [], error: null, count: 0 },
    });

    const { vehicles, totalCount } = await listPublicVehiclePreview(9);

    expect(vehicles).toEqual([]);
    expect(totalCount).toBe(0);
    expect(supabaseMock.callsFor("seo_metas")).toHaveLength(0);
  });
});

describe("attachVehicleSlugs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("詳細ページへのslugを1クエリでまとめて結合する", async () => {
    supabaseMock = createSupabaseAdminMock({
      seo_metas: {
        data: [{ target_id: "v1", slug: "xj-1990" }],
        error: null,
      },
    });

    const result = await attachVehicleSlugs([{ id: "v1" }, { id: "v2" }]);

    expect(result.map((v) => v.slug)).toEqual(["xj-1990", null]);
    expect(
      supabaseMock.callsFor("seo_metas").filter((c) => c.method === "select"),
    ).toHaveLength(1);
  });

  it("対象が無いときはDBを引かない", async () => {
    supabaseMock = createSupabaseAdminMock({});

    await expect(attachVehicleSlugs([])).resolves.toEqual([]);
    expect(supabaseMock.callsFor("seo_metas")).toHaveLength(0);
  });
});

describe("getPublicVehicleStockSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("車種名と年式だけを読む（slugのための2本目のクエリを出さない）", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [{ model_year: 1990, models: { name: "XJ" } }],
        error: null,
      },
    });

    const summary = await getPublicVehicleStockSummary();

    expect(summary).toEqual([{ model_year: 1990, models: { name: "XJ" } }]);
    expect(supabaseMock.callsFor("vehicles")).toContainEqual(
      expect.objectContaining({
        method: "select",
        args: ["model_year, models(name)"],
      }),
    );
    expect(supabaseMock.callsFor("seo_metas")).toHaveLength(0);
  });
});
