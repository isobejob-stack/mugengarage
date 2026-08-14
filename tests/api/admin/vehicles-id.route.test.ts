import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSupabaseAdminMock,
  type SupabaseAdminMock,
} from "../../support/supabase-admin-mock";
import {
  buildPatchPayload,
  buildVehicleRecord,
} from "../../support/vehicle-fixtures";

// このテストは docs/tasks/ISSUE-004-soft-delete-restore-ui-and-test-coverage.md 課題2 に対応する。
// 対象は app/api/admin/vehicles/[id]/route.ts の DELETE / PATCH ハンドラで、
// 以下の最優先業務ルール（docs/development/testing_strategy.md 3章）を担保する:
//   - BR-DEL-001: 物理削除ではなく deleted_at による論理削除
//   - BR-DEL-003: 売約済み（status=sold）車両は削除できない（409 CONFLICT）
//   - BR-HIST-001: 価格変更時は price_histories に追記する（上書きしない／未変更時は追記しない）
//
// モック方針: 実DBには接続せず、`createAdminClient` が返すSupabaseクライアントをフェイクに差し替える。
// ルートハンドラが直接importする周辺の関数（監査ログ・SEO・関連コンテンツ・タグ等）は
// vi.mock でユニット化し、DELETE/PATCHハンドラ自身の分岐ロジックのみを検証対象にする。

let supabaseMock: SupabaseAdminMock;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => supabaseMock.client),
}));

vi.mock("@/lib/api/require-admin", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/lib/inventory/queries", () => ({
  getAdminVehicleById: vi.fn(),
}));

vi.mock("@/lib/archive/queries", () => ({
  ensureOwnerArchiveEntry: vi.fn(),
}));

vi.mock("@/lib/audit/log", () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock("@/lib/seo/queries", () => ({
  getSeoMeta: vi.fn(),
  isSlugTakenInSeoMetas: vi.fn(),
}));

vi.mock("@/lib/seo/service", () => ({
  syncSlugAndCreateRedirect: vi.fn(),
  upsertSeoMetaFields: vi.fn(),
  seoWriteErrorResponse: vi.fn(),
}));

vi.mock("@/lib/related/queries", () => ({
  replaceRelatedContents: vi.fn(),
}));

vi.mock("@/lib/tags/queries", () => ({
  replaceTaggings: vi.fn(),
}));

// vi.mockはファイル冒頭にホイスティングされるため、モック済みの関数は
// importした後に `vi.mocked(...)` 経由で参照する。
import { DELETE, PATCH } from "@/app/api/admin/vehicles/[id]/route";
import { requireAdminUser } from "@/lib/api/require-admin";
import { getAdminVehicleById } from "@/lib/inventory/queries";
import { ensureOwnerArchiveEntry } from "@/lib/archive/queries";
import { recordAuditLog } from "@/lib/audit/log";
import { getSeoMeta } from "@/lib/seo/queries";
import { replaceRelatedContents } from "@/lib/related/queries";
import { replaceTaggings } from "@/lib/tags/queries";

const ADMIN_USER = { id: "admin-user-id" };
const VEHICLE_ID = "11111111-1111-1111-1111-111111111111";

function makeParams(id: string = VEHICLE_ID) {
  return { params: Promise.resolve({ id }) };
}

function makePatchRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/admin/vehicles/${VEHICLE_ID}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  supabaseMock = createSupabaseAdminMock();
  vi.mocked(requireAdminUser).mockResolvedValue(ADMIN_USER as never);
  vi.mocked(recordAuditLog).mockResolvedValue(undefined as never);
  vi.mocked(ensureOwnerArchiveEntry).mockResolvedValue(undefined as never);
  vi.mocked(getSeoMeta).mockResolvedValue(null as never);
  vi.mocked(replaceRelatedContents).mockResolvedValue(undefined as never);
  vi.mocked(replaceTaggings).mockResolvedValue({ error: null } as never);
});

describe("DELETE /api/admin/vehicles/[id]", () => {
  it("BR-DEL-003: 売約済み（status=sold）車両は削除できず409 CONFLICTを返す", async () => {
    vi.mocked(getAdminVehicleById).mockResolvedValue(
      buildVehicleRecord({ id: VEHICLE_ID, status: "sold" }) as never,
    );

    const response = await DELETE(
      new NextRequest(`http://localhost/api/admin/vehicles/${VEHICLE_ID}`, {
        method: "DELETE",
      }),
      makeParams(),
    );
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error.code).toBe("CONFLICT");
    // 実際にDBへ更新（削除）が発行されていないことも確認する
    expect(supabaseMock.callsFor("vehicles")).toHaveLength(0);
  });

  it("未認証の場合は401 UNAUTHORIZEDを返し、削除処理を実行しない", async () => {
    vi.mocked(requireAdminUser).mockResolvedValue(null as never);

    const response = await DELETE(
      new NextRequest(`http://localhost/api/admin/vehicles/${VEHICLE_ID}`, {
        method: "DELETE",
      }),
      makeParams(),
    );

    expect(response.status).toBe(401);
    expect(getAdminVehicleById).not.toHaveBeenCalled();
  });

  it("未売約車両はBR-DEL-001に従い論理削除される（deleted_atがセットされる）", async () => {
    vi.mocked(getAdminVehicleById).mockResolvedValue(
      buildVehicleRecord({ id: VEHICLE_ID, status: "published" }) as never,
    );
    const deletedAt = "2026-08-07T00:00:00.000Z";
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: buildVehicleRecord({
          id: VEHICLE_ID,
          status: "published",
          deleted_at: deletedAt,
        }),
        error: null,
      },
    });

    const response = await DELETE(
      new NextRequest(`http://localhost/api/admin/vehicles/${VEHICLE_ID}`, {
        method: "DELETE",
      }),
      makeParams(),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.deleted_at).toBe(deletedAt);

    // 物理削除（.delete()）ではなく、deleted_atをセットする.update()が呼ばれていること（BR-DEL-001）
    const vehiclesCalls = supabaseMock.callsFor("vehicles");
    expect(vehiclesCalls.some((c) => c.method === "delete")).toBe(false);
    const updateCall = vehiclesCalls.find((c) => c.method === "update");
    expect(updateCall).toBeDefined();
    expect(updateCall?.args[0]).toMatchObject({
      deleted_at: expect.any(String),
    });

    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete", targetId: VEHICLE_ID }),
    );
  });
});

describe("PATCH /api/admin/vehicles/[id]", () => {
  it("BR-HIST-001: 価格を変更した場合、price_historiesに変更前後の価格を追記する", async () => {
    const existing = buildVehicleRecord({
      id: VEHICLE_ID,
      status: "published",
      price: 5_000_000,
    });
    vi.mocked(getAdminVehicleById).mockResolvedValue(existing as never);
    supabaseMock = createSupabaseAdminMock({
      vehicles: {
        data: { ...existing, price: 6_000_000 },
        error: null,
      },
    });

    const payload = buildPatchPayload({
      price: 6_000_000,
      status: "published",
    });
    const response = await PATCH(makePatchRequest(payload), makeParams());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.price).toBe(6_000_000);

    // price_historiesに1回だけ、変更前後の価格が追記されていること（上書きではなく追記）
    const historyCalls = supabaseMock.callsFor("price_histories");
    expect(historyCalls.filter((c) => c.method === "insert")).toHaveLength(1);
    expect(supabaseMock.firstInsertArg("price_histories")).toMatchObject({
      vehicle_id: VEHICLE_ID,
      old_price: 5_000_000,
      new_price: 6_000_000,
      changed_by: ADMIN_USER.id,
    });
  });

  it("価格を変更しなかった場合、price_historiesには追記しない", async () => {
    const existing = buildVehicleRecord({
      id: VEHICLE_ID,
      status: "published",
      price: 5_000_000,
    });
    vi.mocked(getAdminVehicleById).mockResolvedValue(existing as never);
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: existing, error: null },
    });

    const payload = buildPatchPayload({
      price: 5_000_000,
      status: "published",
    });
    const response = await PATCH(makePatchRequest(payload), makeParams());

    expect(response.status).toBe(200);
    expect(supabaseMock.callsFor("price_histories")).toHaveLength(0);
  });

  it("ステータスが「売約済」に変わった場合、オーナーズアーカイブを自動作成する（BR-DEL-003）", async () => {
    const existing = buildVehicleRecord({
      id: VEHICLE_ID,
      status: "negotiating",
      price: 5_000_000,
    });
    vi.mocked(getAdminVehicleById).mockResolvedValue(existing as never);
    supabaseMock = createSupabaseAdminMock({
      vehicles: { data: { ...existing, status: "sold" }, error: null },
    });

    const payload = buildPatchPayload({ price: 5_000_000, status: "sold" });
    const response = await PATCH(makePatchRequest(payload), makeParams());

    expect(response.status).toBe(200);
    expect(ensureOwnerArchiveEntry).toHaveBeenCalledWith(VEHICLE_ID);
  });

  it("未認証の場合は401 UNAUTHORIZEDを返し、更新処理を実行しない", async () => {
    vi.mocked(requireAdminUser).mockResolvedValue(null as never);

    const payload = buildPatchPayload({ price: 6_000_000 });
    const response = await PATCH(makePatchRequest(payload), makeParams());

    expect(response.status).toBe(401);
    expect(getAdminVehicleById).not.toHaveBeenCalled();
  });
});
