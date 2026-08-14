"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reminderFormSchema, type ReminderFormValues } from "@/lib/crm/schema";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/api/client";

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
    const result = await postJson(
      `/api/admin/customers/${customerId}/reminders`,
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
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
        <p className="w-full text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} variant="outline" size="md">
        {isSubmitting ? "追加中..." : "リマインダーを追加"}
      </Button>
    </form>
  );
}
