import { describe, expect, it } from "vitest";
import { vehicleFormSchema } from "@/lib/inventory/schema";
import { emptyToNull } from "@/lib/utils/empty-to-null";
import { sanitizeVehicleWriteValues } from "@/lib/inventory/form-values";
import { buildPatchPayload } from "../support/vehicle-fixtures";

// 「車両を更新できない」という報告（2026-08-17）の再発防止テスト。
//
// 直接の原因は、フォームの選択欄・日付欄が「未設定」を空文字("")で表すのに対し、
// zodスキーマとDBの列がnullを期待していたこと。空文字のまま流れると次の2つが起きる。
//
//   1. `z.enum([...]).nullable()` が "" を通さず、フォーム全体の検証に失敗する。
//      react-hook-form は検証に失敗すると送信関数を呼ばずに黙って終わるため、
//      画面上は「更新するを押しても何も起きない」だけになる。
//   2. date 型の列に "" を書き込もうとしてPostgresが構文エラーを返す。
//      検証は通るのに保存だけが失敗するので、原因がさらに分かりにくい。
//
// 画面側（setValueAs: emptyToNull）とAPI側（sanitizeVehicleWriteValues）の
// 両方で塞いでいることを、ここで固定する。

describe("emptyToNull", () => {
  it("空文字と空白のみの文字列をnullにする", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull("   ")).toBeNull();
  });

  it("値が入っている文字列・数値・null はそのまま返す", () => {
    expect(emptyToNull("inspection_included")).toBe("inspection_included");
    expect(emptyToNull("2027-02-01")).toBe("2027-02-01");
    expect(emptyToNull(0)).toBe(0);
    expect(emptyToNull(null)).toBeNull();
  });
});

describe("車両フォームの「未設定」", () => {
  // 「車検」「法定整備」「リサイクル料金」「ハンドル」は、選び直して「未設定」に戻すと
  // 空文字になる。ここが空文字のままだと車両そのものを保存できなくなる。
  const NULLABLE_ENUM_FIELDS = [
    "shaken_status",
    "legal_maintenance",
    "recycle_fee",
    "steering_side",
  ] as const;

  it.each(NULLABLE_ENUM_FIELDS)(
    "%s は空文字だと検証に失敗する（だからフォーム側でnullに変換している）",
    (field) => {
      const payload = { ...buildPatchPayload(), [field]: "" };
      expect(vehicleFormSchema.safeParse(payload).success).toBe(false);
    },
  );

  it.each(NULLABLE_ENUM_FIELDS)(
    "%s は emptyToNull を通せば検証を通る",
    (field) => {
      const payload = { ...buildPatchPayload(), [field]: emptyToNull("") };
      const result = vehicleFormSchema.safeParse(payload);
      expect(result.success).toBe(true);
    },
  );

  it("車検満了日を空欄に戻しても検証を通る", () => {
    const payload = {
      ...buildPatchPayload(),
      shaken_expiry: emptyToNull(""),
    };
    expect(vehicleFormSchema.safeParse(payload).success).toBe(true);
  });
});

describe("sanitizeVehicleWriteValues", () => {
  it("日付・日時の空文字をnullにしてからDBへ渡す", () => {
    const sanitized = sanitizeVehicleWriteValues({
      shaken_expiry: "",
      scheduled_publish_at: "",
      vin: "",
      price: 1_000_000,
    });

    expect(sanitized.shaken_expiry).toBeNull();
    expect(sanitized.scheduled_publish_at).toBeNull();
    // 日付以外は触らない（textの列は空文字でも書き込めるため、意味を変えない）
    expect(sanitized.vin).toBe("");
    expect(sanitized.price).toBe(1_000_000);
  });

  it("値が入っている日付はそのまま残す", () => {
    const sanitized = sanitizeVehicleWriteValues({
      shaken_expiry: "2027-02-01",
      scheduled_publish_at: "2026-09-01T00:00:00.000Z",
    });

    expect(sanitized.shaken_expiry).toBe("2027-02-01");
    expect(sanitized.scheduled_publish_at).toBe("2026-09-01T00:00:00.000Z");
  });
});
