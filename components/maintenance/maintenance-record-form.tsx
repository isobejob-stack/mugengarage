"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  maintenanceRecordFormSchema,
  emptyMaintenanceRecordFormValues,
  maintenanceCategorySuggestions,
  type MaintenanceRecordFormValues,
} from "@/lib/maintenance/schema";
import { slugify } from "@/lib/content/schema";
import { RelatedContentPicker } from "@/components/related/related-content-picker";
import type { RelatedContentCandidate } from "@/lib/related/types";
import { emptySeoFieldsValues } from "@/lib/seo/schema";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SeoFieldsSection } from "@/components/ui/seo-fields-section";
import { Button } from "@/components/ui/button";
import { deleteJson, sendJson } from "@/lib/api/client";

// SCR-ADM-018: 整備実績編集フォーム
export function MaintenanceRecordForm({
  recordId,
  defaultValues,
  candidates,
}: {
  recordId?: string;
  defaultValues?: MaintenanceRecordFormValues;
  candidates: RelatedContentCandidate[];
}) {
  const router = useRouter();
  const isEdit = Boolean(recordId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceRecordFormValues>({
    resolver: zodResolver(maintenanceRecordFormSchema),
    defaultValues: defaultValues ?? emptyMaintenanceRecordFormValues,
  });

  const onSubmit = async (values: MaintenanceRecordFormValues) => {
    setSubmitError(null);
    const result = await sendJson(
      isEdit
        ? `/api/admin/maintenance-records/${recordId}`
        : "/api/admin/maintenance-records",
      isEdit ? "PATCH" : "POST",
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    router.push("/admin/maintenance-records");
    router.refresh();
  };

  // FR-MNT-001: 整備実績の論理削除
  const handleDelete = async () => {
    if (!recordId) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteJson(
      `/api/admin/maintenance-records/${recordId}`,
    );

    if (!result.ok) {
      setDeleteError(result.message);
      setIsDeleting(false);
      return;
    }

    router.push("/admin/maintenance-records");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 pb-24"
    >
      <Field label="タイトル" error={errors.title?.message}>
        <input
          type="text"
          className="input"
          {...register("title")}
          onChange={(e) => {
            setValue("title", e.target.value);
            if (!slugTouched) {
              setValue("slug", slugify(e.target.value));
            }
          }}
        />
      </Field>

      <Field label="スラッグ（URL）" error={errors.slug?.message}>
        <input
          type="text"
          className="input"
          {...register("slug")}
          onChange={(e) => {
            setSlugTouched(true);
            setValue("slug", e.target.value);
          }}
        />
        {isEdit && (
          <p className="text-foreground-muted mt-1 text-base">
            URLが変更されます。変更前のURLは自動的に新しいURLへリダイレクトされます。
          </p>
        )}
      </Field>

      <Field label="カテゴリ（任意）">
        <input
          type="text"
          className="input"
          list="maintenance-category-suggestions"
          {...register("category")}
        />
        <datalist id="maintenance-category-suggestions">
          {maintenanceCategorySuggestions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="故障事例（任意）">
        <textarea
          rows={4}
          className="input"
          {...register("issue_description")}
        />
      </Field>

      <Field label="費用（円、任意）">
        <input
          type="number"
          className="input"
          {...register("cost", {
            setValueAs: (v) => (v === "" ? null : Number(v)),
          })}
          value={watch("cost") ?? ""}
        />
      </Field>

      <Field label="本文（Markdown）" error={errors.body?.message}>
        <textarea rows={14} className="input" {...register("body")} />
      </Field>

      <Field label="関連コンテンツ（車種・図鑑・ブログ、任意）">
        <RelatedContentPicker
          candidates={candidates}
          selected={watch("related")}
          onChange={(next) => setValue("related", next)}
        />
      </Field>

      {isEdit && (
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
          <p className="text-foreground-muted mt-1 text-base">
            この整備実績を削除すると公開ページから即座に非表示になります。この操作は元に戻せません。
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
            {isDeleting ? "削除中..." : "この整備実績を削除する"}
          </Button>
        </section>
      )}

      <div className="shadow-medium fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="mx-auto block w-full max-w-md justify-center"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "保存する"}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title="整備実績を削除します"
        description="この整備実績を削除します。公開ページから即座に非表示になります。この操作は元に戻せません。"
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
      <span className="text-charcoal-900 text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-base text-red-600" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}
