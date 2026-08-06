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
    const res = await fetch(
      isEdit ? `/api/admin/encyclopedia/${entryId}` : "/api/admin/encyclopedia",
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
      </Field>

      <Field label="本文（Markdown）" error={errors.body?.message}>
        <textarea rows={14} className="input" {...register("body")} />
      </Field>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="mx-auto block min-h-11 w-full max-w-md rounded-md bg-blue-600 font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "保存する"}
        </button>
      </div>
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
