import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdminMock,
  type SupabaseAdminMock,
} from "../support/supabase-admin-mock";

// 車両ごとの写真の「先頭N枚」と「総数」を読むクエリ。
//
// 以前は写真の行（vehicle_photos）を全件読んでから車両ごとに振り分けていた。
// PostgREST は1回に返す行数に上限（既定1,000行）があり、在庫20台・写真1,140枚になった
// 2026-11-08に上限を超え、管理画面の写真枚数が少なく数えられていた。
// また一覧カードの「写真◯枚」は、めくれる枚数（最大5）を出していたため、全車「写真5枚」だった。
//
// ここでは「写真の行を全件読まない」「枚数はDBが数えた総数を使う」ことを固定する。

let supabaseMock: SupabaseAdminMock;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => supabaseMock.client),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

const { getVehicleCardPhotos, getLeadVehiclePhotoPaths, listAdminVehicles } =
  await import("@/lib/inventory/queries");
const { listVehicleMediaStatus } = await import("@/lib/inventory/media");

function photos(vehicleId: string, n: number) {
  return Array.from({ length: n }, (_, i) => ({
    storage_path: `${vehicleId}/p${i}.jpg`,
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getVehicleCardPhotos", () => {
  it("めくれる先頭5枚と、登録されている写真の総数を返す", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          { id: "v1", photos: photos("v1", 5), photo_count: [{ count: 73 }] },
          { id: "v2", photos: [], photo_count: [{ count: 0 }] },
        ],
        error: null,
      },
    });

    const result = await getVehicleCardPhotos(["v1", "v2"]);

    expect(result.get("v1")).toEqual({
      paths: ["v1/p0.jpg", "v1/p1.jpg", "v1/p2.jpg", "v1/p3.jpg", "v1/p4.jpg"],
      // 「写真5枚」ではなく総数
      total: 73,
    });
    expect(result.get("v2")).toEqual({ paths: [], total: 0 });
  });

  it("写真の行を全件読まず、車両の行に先頭N枚と件数を埋め込んで1回で読む", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: [], error: null },
    });

    await getVehicleCardPhotos(["v1"], 5);

    expect(supabaseMock.callsFor("vehicle_photos")).toHaveLength(0);
    const calls = supabaseMock.callsFor("vehicles");
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "select",
        args: [expect.stringContaining("photo_count:vehicle_photos(count)")],
      }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "limit",
        args: [5, { referencedTable: "photos" }],
      }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "order",
        args: ["display_order", { ascending: true, referencedTable: "photos" }],
      }),
    );
  });

  it("論理削除された写真は、先頭N枚にも総数にも含めない", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: [], error: null },
    });

    await getVehicleCardPhotos(["v1"]);

    const calls = supabaseMock.callsFor("vehicles");
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "is",
        args: ["photos.deleted_at", null],
      }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({
        method: "is",
        args: ["photo_count.deleted_at", null],
      }),
    );
  });

  it("車両が無ければDBに問い合わせない", async () => {
    supabaseMock = createSupabaseAdminMock({});
    const result = await getVehicleCardPhotos([]);
    expect(result.size).toBe(0);
    expect(supabaseMock.calls).toHaveLength(0);
  });
});

describe("getLeadVehiclePhotoPaths", () => {
  it("各車両の先頭1枚だけを返し、写真の無い車両は含めない", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          { id: "v1", photos: photos("v1", 1), photo_count: [{ count: 40 }] },
          { id: "v2", photos: [], photo_count: [{ count: 0 }] },
        ],
        error: null,
      },
    });

    const result = await getLeadVehiclePhotoPaths(["v1", "v2"]);

    expect([...result.entries()]).toEqual([["v1", "v1/p0.jpg"]]);
    expect(supabaseMock.callsFor("vehicles")).toContainEqual(
      expect.objectContaining({
        method: "limit",
        args: [1, { referencedTable: "photos" }],
      }),
    );
  });
});

describe("管理画面の写真枚数", () => {
  it("車両一覧の写真枚数は、DBが数えた総数を使う", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          {
            id: "v1",
            status: "published",
            photos: photos("v1", 1),
            photo_count: [{ count: 1140 }],
          },
        ],
        error: null,
      },
    });

    const [row] = await listAdminVehicles();

    expect(row.photoCount).toBe(1140);
    expect(row.leadPhotoUrl).toContain("v1/p0.jpg");
    // 埋め込み用の列を一覧の行にそのまま残さない
    expect(row).not.toHaveProperty("photos");
    expect(row).not.toHaveProperty("photo_count");
    expect(supabaseMock.callsFor("vehicle_photos")).toHaveLength(0);
  });

  it("メディア画面の写真枚数も、DBが数えた総数を使う", async () => {
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: [
          {
            id: "v1",
            status: "published",
            manufacturers: { name: "ジャガー" },
            models: { name: "XJ" },
            photos: photos("v1", 1),
            photo_count: [{ count: 62 }],
          },
          {
            id: "v2",
            status: "published",
            manufacturers: { name: "ジャガー" },
            models: { name: "XJ" },
            photos: [],
            photo_count: [{ count: 0 }],
          },
        ],
        error: null,
      },
      vehicle_videos: { data: [], error: null },
    });

    const rows = await listVehicleMediaStatus();

    // 写真の無い車両が先頭
    expect(rows.map((r) => [r.id, r.photoCount])).toEqual([
      ["v2", 0],
      ["v1", 62],
    ]);
    expect(supabaseMock.callsFor("vehicle_photos")).toHaveLength(0);
  });
});
