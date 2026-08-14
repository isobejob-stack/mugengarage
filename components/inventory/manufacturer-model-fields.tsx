"use client";

import { useMemo, useState } from "react";
import {
  slugifyManufacturerName,
  slugifyModelName,
} from "@/lib/inventory/schema";
import type { Manufacturer, Model } from "@/lib/inventory/types";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";

const CUSTOM_OPTION_VALUE = "__custom__";

// FR-INV-001 / BR-DATA-003:
// 車両登録・編集フォーム（components/inventory/vehicle-form.tsx）と現地クイック登録フォーム
// （components/inventory/quick-vehicle-register.tsx）で共有する、メーカー・車種の選択UI。
// 既存の一覧からの選択に加え、「その他（手入力）」を選ぶとその場で新規メーカー・新規車種を
// 作成できる（components/tags/tag-picker.tsxと同じ、BR-DATA-003: 分類値はハードコードせず
// 管理画面から追加できるマスタデータとして管理するという考え方）。
//
// 車種はメーカーに従属する（models.manufacturer_id）ため、メーカー未選択時は選択・新規作成
// ともに不可とする。メーカー変更時にどの下位項目（車種のみ／車種・シリーズ・世代・グレード等）
// をリセットするかはフォームごとに異なるため、このコンポーネントの責務とはせず、
// onManufacturerChange / onModelChangeの呼び出し元（各フォーム）に委ねる
// （vehicle-form.tsxの既存実装をそのまま踏襲）。
export function ManufacturerModelFields({
  manufacturers,
  models,
  manufacturerId,
  modelId,
  onManufacturerChange,
  onModelChange,
  manufacturerError,
  modelError,
  required,
}: {
  manufacturers: Manufacturer[];
  models: Model[];
  manufacturerId: string;
  modelId: string;
  onManufacturerChange: (id: string) => void;
  onModelChange: (id: string) => void;
  manufacturerError?: string;
  modelError?: string;
  required?: boolean;
}) {
  const [manufacturerList, setManufacturerList] =
    useState<Manufacturer[]>(manufacturers);
  const [modelList, setModelList] = useState<Model[]>(models);

  const [manufacturerCustomMode, setManufacturerCustomMode] = useState(false);
  const [newManufacturerName, setNewManufacturerName] = useState("");
  const [creatingManufacturer, setCreatingManufacturer] = useState(false);
  const [manufacturerCreateError, setManufacturerCreateError] = useState<
    string | null
  >(null);

  const [modelCustomMode, setModelCustomMode] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [creatingModel, setCreatingModel] = useState(false);
  const [modelCreateError, setModelCreateError] = useState<string | null>(null);

  // メーカーが変わったら、直前のメーカーに対する車種の手入力途中状態を引きずらないようにする
  // （既存の<select>実装でメーカー変更時に車種選択が常に空へ戻るのと同じ挙動）。
  // Reactの「レンダー中にstateを調整する」パターン（useEffect内でのsetStateによる
  // カスケードレンダーを避けるため）: https://react.dev/learn/you-might-not-need-an-effect
  const [prevManufacturerId, setPrevManufacturerId] = useState(manufacturerId);
  if (manufacturerId !== prevManufacturerId) {
    setPrevManufacturerId(manufacturerId);
    setModelCustomMode(false);
    setNewModelName("");
    setModelCreateError(null);
  }

  const availableModels = useMemo(
    () => modelList.filter((m) => m.manufacturer_id === manufacturerId),
    [modelList, manufacturerId],
  );

  const createManufacturer = async () => {
    const name = newManufacturerName.trim();
    if (!name) return;
    setManufacturerCreateError(null);
    setCreatingManufacturer(true);

    const result = await postJson<Manufacturer>("/api/admin/manufacturers", {
      name,
      slug: slugifyManufacturerName(name),
    });

    if (!result.ok) {
      setManufacturerCreateError(result.message);
      setCreatingManufacturer(false);
      return;
    }

    const created = result.data;
    setManufacturerList((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja")),
    );
    setNewManufacturerName("");
    setCreatingManufacturer(false);
    setManufacturerCustomMode(false);
    onManufacturerChange(created.id);
  };

  const createModel = async () => {
    const name = newModelName.trim();
    if (!name || !manufacturerId) return;
    setModelCreateError(null);
    setCreatingModel(true);

    const result = await postJson<Model>("/api/admin/models", {
      manufacturer_id: manufacturerId,
      name,
      slug: slugifyModelName(name),
    });

    if (!result.ok) {
      setModelCreateError(result.message);
      setCreatingModel(false);
      return;
    }

    const created = result.data;
    setModelList((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja")),
    );
    setNewModelName("");
    setCreatingModel(false);
    setModelCustomMode(false);
    onModelChange(created.id);
  };

  return (
    <>
      <PickerField
        label="メーカー"
        required={required}
        error={manufacturerError}
      >
        {!manufacturerCustomMode ? (
          <select
            className="input"
            value={manufacturerId}
            onChange={(e) => {
              if (e.target.value === CUSTOM_OPTION_VALUE) {
                setManufacturerCustomMode(true);
                return;
              }
              onManufacturerChange(e.target.value);
            }}
          >
            <option value="">選択してください</option>
            {manufacturerList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            <option value={CUSTOM_OPTION_VALUE}>その他（手入力）</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="新しいメーカー名"
              value={newManufacturerName}
              onChange={(e) => setNewManufacturerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createManufacturer();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={creatingManufacturer || !newManufacturerName.trim()}
              onClick={() => void createManufacturer()}
            >
              {creatingManufacturer ? "作成中..." : "追加"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setManufacturerCustomMode(false);
                setNewManufacturerName("");
                setManufacturerCreateError(null);
              }}
            >
              キャンセル
            </Button>
          </div>
        )}
        {manufacturerCreateError && (
          <p className="mt-1 text-base text-red-600" role="alert">
            {manufacturerCreateError}
          </p>
        )}
      </PickerField>

      <PickerField label="車種" required={required} error={modelError}>
        {!modelCustomMode ? (
          <select
            className="input"
            value={modelId}
            disabled={!manufacturerId}
            onChange={(e) => {
              if (e.target.value === CUSTOM_OPTION_VALUE) {
                setModelCustomMode(true);
                return;
              }
              onModelChange(e.target.value);
            }}
          >
            <option value="">選択してください</option>
            {availableModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            {manufacturerId && (
              <option value={CUSTOM_OPTION_VALUE}>その他（手入力）</option>
            )}
          </select>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="新しい車種名"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createModel();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={
                creatingModel || !newModelName.trim() || !manufacturerId
              }
              onClick={() => void createModel()}
            >
              {creatingModel ? "作成中..." : "追加"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModelCustomMode(false);
                setNewModelName("");
                setModelCreateError(null);
              }}
            >
              キャンセル
            </Button>
          </div>
        )}
        {modelCreateError && (
          <p className="mt-1 text-base text-red-600" role="alert">
            {modelCreateError}
          </p>
        )}
      </PickerField>
    </>
  );
}

function PickerField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-charcoal-900 text-base font-medium">
        {label}
        {required && <span className="ml-1 text-red-600">必須</span>}
      </span>
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-base text-red-600" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}
