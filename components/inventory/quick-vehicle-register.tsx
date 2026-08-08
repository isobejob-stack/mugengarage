"use client";

import { useState } from "react";
import { emptyVehicleFormValues } from "@/lib/inventory/schema";
import type { Manufacturer, Model } from "@/lib/inventory/types";
import { postJson } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { VehicleMediaManager } from "@/components/inventory/vehicle-media-manager";
import { ManufacturerModelFields } from "@/components/inventory/manufacturer-model-fields";

// FR-INV-001 / FR-INV-009: 現地即時登録フロー（SCR-ADM-004の派生）
// ステップ1: メーカー・車種・参考価格のみの最小フォームでPOST /api/admin/vehiclesを呼ぶ
//   （lib/inventory/schema.tsのvehicleFormSchemaはこれら以外nullable/optionalのため、
//    emptyVehicleFormValuesをベースに上書きするだけで既存APIをそのまま利用できる）。
// ステップ2: 作成された車両IDでVehicleMediaManagerを埋め込み、その場で写真を撮って追加できるようにする。
export function QuickVehicleRegister({
  manufacturers,
  models,
}: {
  manufacturers: Manufacturer[];
  models: Model[];
}) {
  const [step, setStep] = useState<"form" | "photos">("form");
  const [manufacturerId, setManufacturerId] = useState("");
  const [modelId, setModelId] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(
    null,
  );

  const canSubmit = manufacturerId !== "" && modelId !== "" && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    // 現地（屋外）でスマートフォンから使う機能のため、通信断が最も起きやすい。
    // 従来は fetch を直接呼んでおり、電波が切れると例外でハンドラを抜けてしまい、
    // setSubmitting(false) に到達せずボタンが「登録中...」のまま永久に固まっていた。
    // 通信失敗も必ず結果として受け取れるようにする（lib/api/client.ts）。
    const result = await postJson<{ id: string }>("/api/admin/vehicles", {
      ...emptyVehicleFormValues,
      manufacturer_id: manufacturerId,
      model_id: modelId,
      // 未入力時は0として送信する（依頼内容どおり）
      price: price === "" ? 0 : Number(price),
      status: "draft",
    });

    if (!result.ok) {
      setSubmitError(result.message);
      setSubmitting(false);
      return;
    }

    setCreatedVehicleId(result.data.id);
    setSubmitting(false);
    setStep("photos");
  };

  if (step === "photos" && createdVehicleId) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardBody>
            <p className="text-base font-medium text-charcoal-900">
              車両を登録しました。続きの詳細情報（諸元・コメント等）は後で入力できます。
            </p>
            <Button
              href={`/admin/vehicles/${createdVehicleId}/edit`}
              variant="primary"
              size="lg"
              className="mt-4 w-full justify-center"
            >
              詳細情報の入力へ進む（編集画面を開く）
            </Button>
          </CardBody>
        </Card>

        <div>
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            写真
          </h2>
          <p className="mt-1 text-base text-foreground-muted">
            その場で車の写真を撮ってアップロードできます。並び替え・削除は編集画面からも行えます。
          </p>
          <div className="mt-4">
            <VehicleMediaManager
              vehicleId={createdVehicleId}
              initialPhotos={[]}
              initialVideos={[]}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-5"
    >
      {/* FR-INV-001 / BR-DATA-003: 既存メーカー・車種からの選択に加え、「その他（手入力）」で
          その場に新規メーカー・新規車種を作成できる（components/inventory/manufacturer-model-fields.tsx） */}
      <ManufacturerModelFields
        manufacturers={manufacturers}
        models={models}
        manufacturerId={manufacturerId}
        modelId={modelId}
        required
        onManufacturerChange={(id) => {
          setManufacturerId(id);
          setModelId("");
        }}
        onModelChange={(id) => setModelId(id)}
      />

      <Field label="参考価格（円・任意）">
        <input
          type="number"
          inputMode="numeric"
          className="input"
          placeholder="未入力の場合は0円で登録されます"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Field>

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        variant="primary"
        size="lg"
        className="w-full justify-center"
      >
        {submitting ? "登録中..." : "この内容で登録して写真を撮る"}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-base font-medium text-charcoal-900">
        {label}
        {required && <span className="ml-1 text-red-600">必須</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
