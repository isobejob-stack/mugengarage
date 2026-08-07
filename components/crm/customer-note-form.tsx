"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerNoteFormSchema,
  type CustomerNoteFormValues,
} from "@/lib/crm/schema";
import { Button } from "@/components/ui/button";

// FR-CRM-003: 顧客メモ追加フォーム
export function CustomerNoteForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CustomerNoteFormValues>({
    resolver: zodResolver(customerNoteFormSchema),
    defaultValues: { body: "" },
  });

  const onSubmit = async (values: CustomerNoteFormValues) => {
    setSubmitError(null);
    const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error?.message ?? "保存に失敗しました");
      return;
    }

    reset({ body: "" });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <textarea
        rows={3}
        className="input"
        placeholder="メモを入力"
        {...register("body")}
      />
      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="outline"
        size="md"
        className="self-start"
      >
        {isSubmitting ? "追加中..." : "メモを追加"}
      </Button>
    </form>
  );
}
