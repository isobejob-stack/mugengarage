import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdminMock,
  type SupabaseAdminMock,
} from "../support/supabase-admin-mock";

// 車種の絞り込み選択肢（getVehicleSearchFacetOptions）の振る舞いを固定する。
//
// この関数はトップページと在庫一覧の両方が毎リクエスト呼ぶ。
// 以前は「在庫のmodel_idを集める」「そのidで車種名を引く」の2往復に分かれていたのを、
// 車種名を在庫の行に結合して1往復にまとめた。
// 往復を減らしても選択肢の中身（台数・論理削除の除外・並び順）が変わらないことを担保する。

let supabaseMock: SupabaseAdminMock;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => supabaseMock.client),
}));

const { getVehicleSearchFacetOptions } = await import("@/lib/inventory/search");

function model(id: string, name: string, deletedAt: string | null = null) {
  return { id, name, deleted_at: deletedAt };
}

describe("getVehicleSearchFacetOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("在庫のある車種を台数付きで返す（DBへの問い合わせは1回だけ）", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          { model_id: "m-xj", models: model("m-xj", "XJ") },
          { model_id: "m-xj", models: model("m-xj", "XJ") },
          { model_id: "m-etype", models: model("m-etype", "Eタイプ") },
        ],
        error: null,
      },
    });

    const { models } = await getVehicleSearchFacetOptions();

    expect(models).toEqual([
      { id: "m-etype", name: "Eタイプ", count: 1 },
      { id: "m-xj", name: "XJ", count: 2 },
    ]);
    // models テーブルへの2本目のクエリは投げない
    expect(supabaseMock.callsFor("models")).toHaveLength(0);
    expect(
      supabaseMock.callsFor("vehicles").filter((c) => c.method === "select"),
    ).toHaveLength(1);
  });

  it("公開中・論理削除されていない在庫だけを数える", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: [], error: null },
    });

    await getVehicleSearchFacetOptions();

    const calls = supabaseMock.callsFor("vehicles");
    expect(calls).toContainEqual(
      expect.objectContaining({ method: "eq", args: ["status", "published"] }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({ method: "is", args: ["deleted_at", null] }),
    );
  });

  it("論理削除された車種と、車種が未設定の在庫は選択肢に出さない", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          { model_id: "m-xj", models: model("m-xj", "XJ") },
          {
            model_id: "m-old",
            models: model("m-old", "廃止車種", "2026-01-01T00:00:00Z"),
          },
          { model_id: null, models: null },
        ],
        error: null,
      },
    });

    const { models } = await getVehicleSearchFacetOptions();

    expect(models).toEqual([{ id: "m-xj", name: "XJ", count: 1 }]);
  });

  it("車種名の順に並べる", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          { model_id: "c", models: model("c", "XK") },
          { model_id: "a", models: model("a", "Mark2") },
          { model_id: "b", models: model("b", "Sタイプ") },
        ],
        error: null,
      },
    });

    const { models } = await getVehicleSearchFacetOptions();

    expect(models.map((m) => m.name)).toEqual(["Mark2", "Sタイプ", "XK"]);
  });

  it("在庫が1台も無ければ空の選択肢を返す", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: null, error: null },
    });

    await expect(getVehicleSearchFacetOptions()).resolves.toEqual({
      models: [],
    });
  });
});
