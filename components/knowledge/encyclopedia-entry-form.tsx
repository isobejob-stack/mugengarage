"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  encyclopediaEntryFormSchema,
  emptyEncyclopediaEntryFormValues,
  encyclopediaCategoryLabels,
  type EncyclopediaEntryFormValues,
} from "@/lib/knowledge/schema";
import { slugify } from "@/lib/content/schema";
import type { EncyclopediaEntry } from "@/lib/knowledge/types";
import { emptySeoFieldsValues } from "@/lib/seo/schema";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SeoFieldsSection } from "@/components/ui/seo-fields-section";
import { Button } from "@/components/ui/button";
import { deleteJson, sendJson } from "@/lib/api/client";

// SCR-ADM-012: 図鑑編集フォーム
export function EncyclopediaEntryForm({
  entryId,
  defaultValues,
  candidateParents,
}: {
  entryId?: string;
  defaultValues?: EncyclopediaEntryFormValues;
  candidateParents: EncyclopediaEntry[];
}) {
  const router = useRouter();
  const isEdit = Boolean(entryId);
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
  } = useForm<EncyclopediaEntryFormValues>({
    resolver: zodResolver(encyclopediaEntryFormSchema),
    defaultValues: defaultValues ?? emptyEncyclopediaEntryFormValues,
  });

  const onSubmit = async (values: EncyclopediaEntryFormValues) => {
    setSubmitError(null);
    const result = await sendJson(
      isEdit ? `/api/admin/encyclopedia/${entryId}` : "/api/admin/encyclopedia",
      isEdit ? "PATCH" : "POST",
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    router.push("/admin/encyclopedia");
    router.refresh();
  };

  // FR-ENC-001: 図鑑項目の論理削除
  const handleDelete = async () => {
    if (!entryId) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteJson(`/api/admin/encyclopedia/${entryId}`);

    if (!result.ok) {
      setDeleteError(result.message);
      setIsDeleting(false);
      return;
    }

    router.push("/admin/encyclopedia");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 pb-24"
    >
      <Field label="カテゴリ">
        <select className="input" {...register("category")}>
          {Object.entries(encyclopediaCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="親項目（任意、階層表示用）">
        <select
          className="input"
          value={watch("parent_id") ?? ""}
          onChange={(e) => setValue("parent_id", e.target.value || null)}
        >
          <option value="">なし</option>
          {candidateParents
            .filter((p) => p.id !== entryId)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {encyclopediaCategoryLabels[p.category]} / {p.title}
              </option>
            ))}
        </select>
      </Field>

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

      <Field label="本文（Markdown）" error={errors.body?.message}>
        <textarea rows={14} className="input" {...register("body")} />
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
            この図鑑項目を削除すると公開ページから即座に非表示になります。この操作は元に戻せません。
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
            {isDeleting ? "削除中..." : "この図鑑項目を削除する"}
          </Button>
        </section>
      )}

      <div className="shadow-medium fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="mx-auto w-full max-w-md justify-center"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "保存する"}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title="図鑑項目を削除します"
        description="この図鑑項目を削除します。公開ページから即座に非表示になります。この操作は元に戻せません。"
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
