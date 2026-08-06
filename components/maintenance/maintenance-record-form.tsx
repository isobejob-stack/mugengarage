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
    const res = await fetch(
      isEdit
        ? `/api/admin/maintenance-records/${recordId}`
        : "/api/admin/maintenance-records",
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

    router.push("/admin/maintenance-records");
    router.refresh();
  };

  // FR-MNT-001: 整備実績の論理削除
  const handleDelete = async () => {
    if (!recordId) return;
    setDeleteError(null);
    setIsDeleting(true);
    const res = await fetch(`/api/admin/maintenance-records/${recordId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setDeleteError(body?.error?.message ?? "削除に失敗しました");
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
          <p className="mt-1 text-base text-neutral-600">
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

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      {isEdit && (
        <section className="rounded-md border border-red-200 bg-red-50 p-4">
          <h2 className="text-base font-bold text-red-700">危険な操作</h2>
          <p className="mt-1 text-base text-neutral-600">
            この整備実績を削除すると公開ページから即座に非表示になります。この操作は元に戻せません。
          </p>
          {deleteError && (
            <p className="mt-2 text-base text-red-600">{deleteError}</p>
          )}
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setPendingDelete(true)}
            className="mt-3 min-h-11 rounded-md border border-red-600 px-4 text-base font-medium text-red-600 disabled:opacity-60"
          >
            {isDeleting ? "削除中..." : "この整備実績を削除する"}
          </button>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="mx-auto block min-h-11 w-full max-w-md rounded-md bg-blue-600 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "保存する"}
        </button>
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
      <span className="text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
