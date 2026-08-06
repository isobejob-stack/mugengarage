"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vehicleFormSchema,
  emptyVehicleFormValues,
  type VehicleFormValues,
} from "@/lib/inventory/schema";
import type {
  Manufacturer,
  Model,
  Series,
  Generation,
  Grade,
  GradeTemplate,
} from "@/lib/inventory/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type HierarchyOptions = {
  manufacturers: Manufacturer[];
  models: Model[];
  series: Series[];
  generations: Generation[];
  grades: Grade[];
  gradeTemplates: GradeTemplate[];
};

// SCR-ADM-004: 車両登録・編集フォーム（02_admin_ui_spec.md 6章のセクション構成に対応）
export function VehicleForm({
  options,
  vehicleId,
  defaultValues,
}: {
  options: HierarchyOptions;
  vehicleId?: string;
  defaultValues?: VehicleFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(vehicleId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<VehicleFormValues | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: defaultValues ?? emptyVehicleFormValues,
  });

  const manufacturerId = watch("manufacturer_id");
  const modelId = watch("model_id");
  const seriesId = watch("series_id");
  const generationId = watch("generation_id");

  const models = useMemo(
    () => options.models.filter((m) => m.manufacturer_id === manufacturerId),
    [options.models, manufacturerId],
  );
  const seriesList = useMemo(
    () => options.series.filter((s) => s.model_id === modelId),
    [options.series, modelId],
  );
  const generations = useMemo(
    () => options.generations.filter((g) => g.series_id === seriesId),
    [options.generations, seriesId],
  );
  const grades = useMemo(
    () => options.grades.filter((g) => g.generation_id === generationId),
    [options.grades, generationId],
  );

  // FR-VEH-004: グレード選択時、未入力の項目にのみテンプレートを自動入力する
  const applyGradeTemplate = (gradeId: string | null) => {
    const template = options.gradeTemplates.find((t) => t.grade_id === gradeId);
    if (!template) return;

    if (!getValues("engine_features") && template.engine_features_template) {
      setValue("engine_features", template.engine_features_template);
    }
    if (!getValues("common_issues") && template.common_issues_template) {
      setValue("common_issues", template.common_issues_template);
    }
    if (!getValues("maintenance_cost") && template.maintenance_cost_template) {
      setValue("maintenance_cost", template.maintenance_cost_template);
    }
  };

  const submit = async (values: VehicleFormValues) => {
    setSubmitError(null);

    // 03_ui_rules.md 7章: 価格変更時は確認ダイアログを挟む
    if (isEdit && defaultValues && values.price !== defaultValues.price) {
      setPendingValues(values);
      return;
    }

    await save(values);
  };

  const save = async (values: VehicleFormValues) => {
    setSubmitError(null);
    const res = await fetch(
      isEdit ? `/api/admin/vehicles/${vehicleId}` : "/api/admin/vehicles",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error?.message ?? "保存に失敗しました");
      return;
    }

    router.push("/admin/vehicles");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-10 pb-24"
    >
      <section>
        <h2 className="text-lg font-bold">基本情報</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="メーカー" error={errors.manufacturer_id?.message}>
            <select
              className="input"
              {...register("manufacturer_id")}
              onChange={(e) => {
                setValue("manufacturer_id", e.target.value);
                setValue("model_id", "");
                setValue("series_id", null);
                setValue("generation_id", null);
                setValue("grade_id", null);
              }}
            >
              <option value="">選択してください</option>
              {options.manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="車種" error={errors.model_id?.message}>
            <select
              className="input"
              {...register("model_id")}
              disabled={!manufacturerId}
              onChange={(e) => {
                setValue("model_id", e.target.value);
                setValue("series_id", null);
                setValue("generation_id", null);
                setValue("grade_id", null);
              }}
            >
              <option value="">選択してください</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="シリーズ（任意）">
            <select
              className="input"
              value={seriesId ?? ""}
              disabled={!modelId}
              onChange={(e) => {
                setValue("series_id", e.target.value || null);
                setValue("generation_id", null);
                setValue("grade_id", null);
              }}
            >
              <option value="">未設定</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="世代（任意）">
            <select
              className="input"
              value={generationId ?? ""}
              disabled={!seriesId}
              onChange={(e) => {
                setValue("generation_id", e.target.value || null);
                setValue("grade_id", null);
              }}
            >
              <option value="">未設定</option>
              {generations.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="グレード（任意）">
            <select
              className="input"
              value={watch("grade_id") ?? ""}
              disabled={!generationId}
              onChange={(e) => {
                const value = e.target.value || null;
                setValue("grade_id", value);
                applyGradeTemplate(value);
              }}
            >
              <option value="">未設定</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="価格（円）" error={errors.price?.message}>
            <input
              type="number"
              className="input"
              {...register("price", {
                setValueAs: (v) => (v === "" ? 0 : Number(v)),
              })}
            />
          </Field>

          <Field label="年式">
            <input
              type="number"
              className="input"
              {...register("model_year", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("model_year") ?? ""}
            />
          </Field>
          <Field label="走行距離（km）">
            <input
              type="number"
              className="input"
              {...register("mileage_km", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("mileage_km") ?? ""}
            />
          </Field>
          <Field label="エンジン">
            <input
              type="text"
              className="input"
              {...register("engine")}
              value={watch("engine") ?? ""}
            />
          </Field>
          <Field label="ミッション">
            <input
              type="text"
              className="input"
              {...register("transmission")}
              value={watch("transmission") ?? ""}
            />
          </Field>
          <Field label="外装色">
            <input
              type="text"
              className="input"
              {...register("exterior_color")}
              value={watch("exterior_color") ?? ""}
            />
          </Field>
          <Field label="内装色">
            <input
              type="text"
              className="input"
              {...register("interior_color")}
              value={watch("interior_color") ?? ""}
            />
          </Field>
          <Field label="VIN（車台番号）">
            <input
              type="text"
              className="input"
              {...register("vin")}
              value={watch("vin") ?? ""}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">自由入力コンテンツ（Markdown）</h2>
        <div className="mt-4 flex flex-col gap-4">
          <TextAreaField
            label="販売コメント"
            name="sales_comment"
            register={register}
            watch={watch}
          />
          <TextAreaField
            label="店長コメント"
            name="manager_comment"
            register={register}
            watch={watch}
          />
          <TextAreaField
            label="この車の魅力"
            name="appeal_points"
            register={register}
            watch={watch}
          />
          <TextAreaField
            label="エンジンの特徴"
            name="engine_features"
            register={register}
            watch={watch}
          />
          <TextAreaField
            label="よくある故障"
            name="common_issues"
            register={register}
            watch={watch}
          />
          <TextAreaField
            label="維持費"
            name="maintenance_cost"
            register={register}
            watch={watch}
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">公開設定</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="公開ステータス">
            <select className="input" {...register("status")}>
              <option value="draft">非公開</option>
              <option value="published">公開中</option>
              <option value="negotiating">商談中</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="sold">売約済</option>
            </select>
          </Field>
          <div className="flex items-end gap-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("is_recommended")} />
              おすすめ
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("is_new_arrival")} />
              新着
            </label>
          </div>
        </div>
      </section>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="mx-auto block min-h-11 w-full max-w-md rounded-md bg-blue-600 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "登録する"}
        </button>
      </div>

      <ConfirmDialog
        open={pendingValues !== null}
        title="価格を変更します"
        description="変更前後の価格が履歴に残ります。よろしいですか？"
        confirmLabel="変更する"
        onCancel={() => setPendingValues(null)}
        onConfirm={() => {
          if (pendingValues) void save(pendingValues);
          setPendingValues(null);
        }}
      />
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function TextAreaField({
  label,
  name,
  register,
  watch,
}: {
  label: string;
  name: keyof VehicleFormValues;
  register: ReturnType<typeof useForm<VehicleFormValues>>["register"];
  watch: ReturnType<typeof useForm<VehicleFormValues>>["watch"];
}) {
  return (
    <Field label={label}>
      <textarea
        rows={4}
        className="input"
        {...register(name)}
        value={(watch(name) as string | null) ?? ""}
      />
    </Field>
  );
}
