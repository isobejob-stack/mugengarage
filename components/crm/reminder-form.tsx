"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reminderFormSchema, type ReminderFormValues } from "@/lib/crm/schema";

// FR-CRM-004: リマインダー追加フォーム
export function ReminderForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: { title: "", due_date: "" },
  });

  const onSubmit = async (values: ReminderFormValues) => {
    setSubmitError(null);
    const res = await fetch(`/api/admin/customers/${customerId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error?.message ?? "保存に失敗しました");
      return;
    }

    reset({ title: "", due_date: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-2">
      <input
        type="text"
        className="input flex-1"
        placeholder="例：車検時期のご連絡"
        {...register("title")}
      />
      <input type="date" className="input w-40" {...register("due_date")} />
      {submitError && (
        <p className="w-full text-sm text-red-600">{submitError}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 rounded-md border border-neutral-300 px-4 py-2 text-sm disabled:opacity-60"
      >
        {isSubmitting ? "追加中..." : "リマインダーを追加"}
      </button>
    </form>
  );
}
