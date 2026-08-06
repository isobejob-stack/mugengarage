"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  libraryEntryFormSchema,
  emptyLibraryEntryFormValues,
  type LibraryEntryFormValues,
} from "@/lib/library/schema";
import { slugify } from "@/lib/content/schema";
import { RelatedContentPicker } from "@/components/related/related-content-picker";
import type { RelatedContentCandidate } from "@/lib/related/types";

// SCR-ADM-016: ライブラリ編集フォーム
export function LibraryEntryForm({
  entryId,
  defaultValues,
  candidates,
}: {
  entryId?: string;
  defaultValues?: LibraryEntryFormValues;
  candidates: RelatedContentCandidate[];
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
  } = useForm<LibraryEntryFormValues>({
    resolver: zodResolver(libraryEntryFormSchema),
    defaultValues: defaultValues ?? emptyLibraryEntryFormValues,
  });

  const onSubmit = async (values: LibraryEntryFormValues) => {
    setSubmitError(null);
    const res = await fetch(
      isEdit ? `/api/admin/library/${entryId}` : "/api/admin/library",
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

    router.push("/admin/library");
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
      </Field>

      <Field label="読み仮名（ひらがな、五十音検索用）">
        <input type="text" className="input" {...register("reading_kana")} />
      </Field>

      <Field label="カテゴリ（任意）">
        <input type="text" className="input" {...register("category")} />
      </Field>

      <Field label="本文（Markdown）" error={errors.body?.message}>
        <textarea rows={14} className="input" {...register("body")} />
      </Field>

      <Field label="関連コンテンツ（任意、相互リンク用）">
        <RelatedContentPicker
          candidates={candidates}
          selected={watch("related")}
          onChange={(next) => setValue("related", next)}
        />
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
