"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  timelineEventFormSchema,
  emptyTimelineEventFormValues,
  timelineCategoryLabels,
  type TimelineEventFormValues,
} from "@/lib/timeline/schema";
import { RelatedContentPicker } from "@/components/related/related-content-picker";
import type { RelatedContentCandidate } from "@/lib/related/types";

// SCR-ADM-014: 年表編集フォーム
export function TimelineEventForm({
  eventId,
  defaultValues,
  candidates,
}: {
  eventId?: string;
  defaultValues?: TimelineEventFormValues;
  candidates: RelatedContentCandidate[];
}) {
  const router = useRouter();
  const isEdit = Boolean(eventId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventFormSchema),
    defaultValues: defaultValues ?? emptyTimelineEventFormValues,
  });

  const onSubmit = async (values: TimelineEventFormValues) => {
    setSubmitError(null);
    const res = await fetch(
      isEdit ? `/api/admin/timeline/${eventId}` : "/api/admin/timeline",
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

    router.push("/admin/timeline");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 pb-24"
    >
      <Field label="日付" error={errors.event_date?.message}>
        <input type="date" className="input" {...register("event_date")} />
      </Field>

      <Field label="日付の精度">
        <select className="input" {...register("date_precision")}>
          <option value="year">年のみ</option>
          <option value="month">年月</option>
          <option value="day">年月日</option>
        </select>
      </Field>

      <Field label="カテゴリ">
        <select className="input" {...register("category")}>
          {Object.entries(timelineCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="タイトル" error={errors.title?.message}>
        <input type="text" className="input" {...register("title")} />
      </Field>

      <Field label="本文（Markdown、任意）">
        <textarea rows={10} className="input" {...register("body")} />
      </Field>

      <Field label="関連コンテンツ（任意）">
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
