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
import { emptySeoFieldsValues } from "@/lib/seo/schema";
import { SeoFieldsSection } from "@/components/ui/seo-fields-section";
import type {
  Manufacturer,
  Model,
  Series,
  Generation,
  Grade,
  GradeTemplate,
  VehicleVideo,
} from "@/lib/inventory/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  VehicleMediaManager,
  type PhotoWithUrl,
} from "@/components/inventory/vehicle-media-manager";
import { RelatedContentPicker } from "@/components/related/related-content-picker";
import type { RelatedContentCandidate } from "@/lib/related/types";
import { TagPicker } from "@/components/tags/tag-picker";
import { ManufacturerModelFields } from "@/components/inventory/manufacturer-model-fields";
import type { Tag } from "@/lib/seo/types";
import { deleteJson, sendJson } from "@/lib/api/client";
import {
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
} from "@/lib/utils/datetime-local";

// 「あり／なし」に加えて「未設定」を持つ項目のための変換。
// チェックボックスでは未設定と「なし」を区別できず、未入力の車両が
// すべて「なし」として公開されてしまうため、3択のselectで扱う。
function toNullableBoolean(value: unknown): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function booleanSelectValue(value: boolean | null | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "";
}

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
  initialPhotos,
  initialVideos,
  candidates,
  allTags,
}: {
  options: HierarchyOptions;
  vehicleId?: string;
  defaultValues?: VehicleFormValues;
  initialPhotos?: PhotoWithUrl[];
  initialVideos?: VehicleVideo[];
  candidates?: RelatedContentCandidate[];
  allTags?: Tag[];
}) {
  const relatedCandidates = candidates ?? [];
  const tagOptions = allTags ?? [];
  const router = useRouter();
  const isEdit = Boolean(vehicleId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingValues, setPendingValues] = useState<VehicleFormValues | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    const result = await sendJson(
      isEdit ? `/api/admin/vehicles/${vehicleId}` : "/api/admin/vehicles",
      isEdit ? "PATCH" : "POST",
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    router.push("/admin/vehicles");
    router.refresh();
  };

  // FR-INV-003: 車両の論理削除。BR-DEL-003により売約済み車両はAPI側で409を返す
  const handleDelete = async () => {
    if (!vehicleId) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteJson(`/api/admin/vehicles/${vehicleId}`);

    if (!result.ok) {
      // 409は「売約済みの車両は削除できない」という業務上の制約による拒否。
      // サーバーが理由を返すためそれを優先しつつ、本文が無い場合の既定文言を状況別に出し分ける。
      setDeleteError(
        result.status === 409
          ? result.message || "売約済みの車両は削除できません"
          : result.message,
      );
      setIsDeleting(false);
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
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          基本情報
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* FR-INV-001 / BR-DATA-003: 既存メーカー・車種からの選択に加え、「その他（手入力）」で
              その場に新規メーカー・新規車種を作成できる（components/inventory/manufacturer-model-fields.tsx） */}
          <ManufacturerModelFields
            manufacturers={options.manufacturers}
            models={options.models}
            manufacturerId={manufacturerId}
            modelId={modelId}
            manufacturerError={errors.manufacturer_id?.message}
            modelError={errors.model_id?.message}
            onManufacturerChange={(id) => {
              setValue("manufacturer_id", id);
              setValue("model_id", "");
              setValue("series_id", null);
              setValue("generation_id", null);
              setValue("grade_id", null);
            }}
            onModelChange={(id) => {
              setValue("model_id", id);
              setValue("series_id", null);
              setValue("generation_id", null);
              setValue("grade_id", null);
            }}
          />

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

          <Field label="車両本体価格（円）" error={errors.price?.message}>
            <input
              type="number"
              className="input"
              {...register("price", {
                setValueAs: (v) => (v === "" ? 0 : Number(v)),
              })}
            />
          </Field>

          {/* 購入検討者が最終的に比較するのは支払総額のため、本体価格と並べて登録できるようにする。
              諸費用が未確定の段階では空欄のままにでき、その場合は公開サイトに表示されない。 */}
          <Field
            label="支払総額（円・諸費用込み）"
            error={errors.total_price?.message}
          >
            <input
              type="number"
              className="input"
              placeholder="未定の場合は空欄"
              {...register("total_price", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </Field>

          {/* 中古車掲載サイトで標準的に載っている取引条件（docs/tasks/ISSUE-006）。
              これまで持てておらず、掲載情報を文章で書くしかなかった項目。 */}
          <Field label="車検">
            <select className="input" {...register("shaken_status")}>
              <option value="">未設定</option>
              <option value="inspection_included">車検整備付</option>
              <option value="valid_until">満了日あり（下の欄に入力）</option>
              <option value="none">車検なし</option>
            </select>
          </Field>

          <Field label="法定整備">
            <select className="input" {...register("legal_maintenance")}>
              <option value="">未設定</option>
              <option value="included">整備付</option>
              <option value="separate">別途</option>
              <option value="none">なし</option>
            </select>
          </Field>

          <Field label="保証">
            <select className="input" {...register("warranty_type")}>
              <option value="">未設定</option>
              <option value="with">保証付</option>
              <option value="without">保証なし</option>
            </select>
          </Field>

          <Field label="保証期間（ヶ月）">
            <input
              type="number"
              className="input"
              {...register("warranty_months", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </Field>

          <Field label="保証距離（km）">
            <input
              type="number"
              className="input"
              {...register("warranty_km", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            />
          </Field>

          {/* 輸入車のため、ハンドル位置は購入判断を大きく左右する */}
          <Field label="ハンドル">
            <select className="input" {...register("steering_side")}>
              <option value="">未設定</option>
              <option value="right">右ハンドル</option>
              <option value="left">左ハンドル</option>
            </select>
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

          {/* ISSUE-006: 以下は公開ページの主要諸元に表示される項目だが、
              これまで入力欄が無く登録できなかったもの。
              特に修復歴・排気量は中古車の購入判断で必ず確認される項目のため、
              入力できないままだと掲載情報として成立しない。 */}
          <Field label="修復歴">
            <select
              className="input"
              {...register("accident_history", { setValueAs: toNullableBoolean })}
              value={booleanSelectValue(watch("accident_history"))}
            >
              <option value="">未設定</option>
              <option value="false">なし</option>
              <option value="true">あり</option>
            </select>
          </Field>

          <Field label="車検満了日">
            <input
              type="date"
              className="input"
              {...register("shaken_expiry")}
              value={watch("shaken_expiry") ?? ""}
            />
          </Field>

          <Field label="登録年">
            <input
              type="number"
              className="input"
              {...register("registration_year", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("registration_year") ?? ""}
            />
          </Field>

          <Field label="排気量（cc）">
            <input
              type="number"
              className="input"
              {...register("displacement_cc", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("displacement_cc") ?? ""}
            />
          </Field>

          <Field label="馬力（ps）">
            <input
              type="number"
              className="input"
              {...register("horsepower", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("horsepower") ?? ""}
            />
          </Field>

          <Field label="トルク">
            <input
              type="text"
              className="input"
              {...register("torque")}
              value={watch("torque") ?? ""}
            />
          </Field>

          <Field label="エンジン型式">
            <input
              type="text"
              className="input"
              {...register("engine_model_code")}
              value={watch("engine_model_code") ?? ""}
            />
          </Field>

          <Field label="駆動方式">
            <input
              type="text"
              className="input"
              {...register("drivetrain")}
              value={watch("drivetrain") ?? ""}
            />
          </Field>

          <Field label="ボディタイプ">
            <input
              type="text"
              className="input"
              {...register("body_type")}
              value={watch("body_type") ?? ""}
            />
          </Field>

          <Field label="シート素材">
            <input
              type="text"
              className="input"
              {...register("seat_material")}
              value={watch("seat_material") ?? ""}
            />
          </Field>

          <Field label="型式">
            <input
              type="text"
              className="input"
              {...register("model_code")}
              value={watch("model_code") ?? ""}
            />
          </Field>

          <Field label="燃料">
            <input
              type="text"
              className="input"
              placeholder="ガソリン など"
              {...register("fuel_type")}
              value={watch("fuel_type") ?? ""}
            />
          </Field>

          <Field label="乗車定員（名）">
            <input
              type="number"
              className="input"
              {...register("capacity", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("capacity") ?? ""}
            />
          </Field>

          <Field label="ドア数">
            <input
              type="number"
              className="input"
              {...register("door_count", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("door_count") ?? ""}
            />
          </Field>

          <Field label="オーナー数（人）">
            <input
              type="number"
              className="input"
              {...register("owner_count", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
              value={watch("owner_count") ?? ""}
            />
          </Field>

          <Field label="リサイクル料金">
            <select className="input" {...register("recycle_fee")}>
              <option value="">未設定</option>
              <option value="included">込み</option>
              <option value="separate">別途</option>
              <option value="none">なし</option>
            </select>
          </Field>

          <Field label="記録簿">
            <select
              className="input"
              {...register("has_record_book", { setValueAs: toNullableBoolean })}
              value={booleanSelectValue(watch("has_record_book"))}
            >
              <option value="">未設定</option>
              <option value="true">あり</option>
              <option value="false">なし</option>
            </select>
          </Field>

          <Field label="保管状況">
            <select
              className="input"
              {...register("indoor_storage", { setValueAs: toNullableBoolean })}
              value={booleanSelectValue(watch("indoor_storage"))}
            >
              <option value="">未設定</option>
              <option value="true">屋内保管</option>
              <option value="false">屋外保管</option>
            </select>
          </Field>

          <Field label="禁煙車">
            <select
              className="input"
              {...register("is_non_smoking", { setValueAs: toNullableBoolean })}
              value={booleanSelectValue(watch("is_non_smoking"))}
            >
              <option value="">未設定</option>
              <option value="true">禁煙車</option>
              <option value="false">該当なし</option>
            </select>
          </Field>

          <Field label="車両所在地">
            <input
              type="text"
              className="input"
              placeholder="東京都◯◯市 など"
              {...register("location_text")}
              value={watch("location_text") ?? ""}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          自由入力コンテンツ（Markdown）
        </h2>
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
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          写真・動画
        </h2>
        <div className="mt-4">
          {isEdit && vehicleId ? (
            <VehicleMediaManager
              vehicleId={vehicleId}
              initialPhotos={initialPhotos ?? []}
              initialVideos={initialVideos ?? []}
            />
          ) : (
            <p className="text-base text-foreground-muted">
              写真・動画の登録は、車両を登録した後に編集画面から行えます。まずは基本情報を入力して登録してください。
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          関連コンテンツ
        </h2>
        <div className="mt-4">
          {/* FR-INV-014: 関連記事／関連図鑑／関連ブログ／関連整備実績の紐付け（BR-DOM-004: 参照のみでコピーしない） */}
          <Field label="関連コンテンツ（記事・図鑑・ライブラリ・整備実績、任意）">
            <RelatedContentPicker
              candidates={relatedCandidates}
              selected={watch("related")}
              onChange={(next) => setValue("related", next)}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          タグ
        </h2>
        <div className="mt-4">
          {/* FR-INV-012: 自由なタグを複数付与できる（BR-DATA-003: マスタデータとして管理） */}
          <Field label="タグ（任意）">
            <TagPicker
              availableTags={tagOptions}
              selectedTagIds={watch("tags")}
              onChange={(next) => setValue("tags", next)}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          公開設定
        </h2>
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
            <label className="flex min-h-11 items-center gap-2 text-base text-charcoal-900">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary-600"
                {...register("is_recommended")}
              />
              おすすめ
            </label>
            <label className="flex min-h-11 items-center gap-2 text-base text-charcoal-900">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary-600"
                {...register("is_new_arrival")}
              />
              新着
            </label>
          </div>
          {/* FR-INV-007: 公開予約。下書き状態の車両にのみ意味を持つ項目のため、その旨をヘルプテキストで明示する */}
          {/* レビュー指摘対応（必須修正1・2）: datetime-localはタイムゾーン情報を持たないローカル時刻
              文字列を扱うため、表示時はUTC ISO→ローカル時刻、送信時はローカル時刻→UTC ISO（空文字はnull）
              に変換する（lib/utils/datetime-local.ts）。 */}
          <Field label="公開予約日時（任意）">
            <input
              type="datetime-local"
              className="input"
              {...register("scheduled_publish_at", {
                setValueAs: (v) => fromDatetimeLocalValue(v as string),
              })}
              value={toDatetimeLocalValue(watch("scheduled_publish_at"))}
            />
            <p className="mt-1 text-base text-foreground-muted">
              指定日時になると自動的に公開ステータスに変わります（公開ステータスが「非公開」の場合のみ有効です）。
            </p>
          </Field>
        </div>
      </section>

      {isEdit && (
        <section>
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            SEO・URL設定
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {/* FR-SEO-004: vehiclesテーブル自体はslugを持たないため、seo_metas.slugを編集対象とする */}
            <Field label="スラッグ（URL）" error={errors.slug?.message}>
              <input
                type="text"
                className="input"
                {...register("slug")}
                value={watch("slug") ?? ""}
              />
            </Field>
            <p className="text-base text-foreground-muted">
              URLが変更されます。変更前のURLは自動的に新しいURLへリダイレクトされます。
            </p>
            <SeoFieldsSection
              value={watch("seo") ?? emptySeoFieldsValues}
              onChange={(next) => setValue("seo", next)}
              errors={{
                title: errors.seo?.title?.message,
                description: errors.seo?.description?.message,
                og_image_url: errors.seo?.og_image_url?.message,
                canonical_url: errors.seo?.canonical_url?.message,
              }}
            />
          </div>
        </section>
      )}

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}

      {isEdit && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="font-serif text-lg font-bold text-red-700">
            危険な操作
          </h2>
          <p className="mt-1 text-base text-foreground-muted">
            この車両を削除すると公開ページから即座に非表示になります。この操作は元に戻せません。
          </p>
          {deleteError && (
            <p className="mt-2 text-base text-red-600" role="alert">
              {deleteError}
            </p>
          )}
          <Button
            type="button"
            disabled={isDeleting}
            onClick={() => setPendingDelete(true)}
            variant="destructive"
            size="md"
            className="mt-3"
          >
            {isDeleting ? "削除中..." : "この車両を削除する"}
          </Button>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 shadow-medium pb-[env(safe-area-inset-bottom)]">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="mx-auto w-full max-w-md justify-center"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "登録する"}
        </Button>
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

      <ConfirmDialog
        open={pendingDelete}
        title="車両を削除します"
        description="この車両を削除します。公開ページから即座に非表示になります。この操作は元に戻せません。"
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDelete(false)}
        onConfirm={() => {
          setPendingDelete(false);
          void handleDelete();
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
      <span className="text-base font-medium text-charcoal-900">{label}</span>
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-base text-red-600" role="alert">
          {error}
        </p>
      )}
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
