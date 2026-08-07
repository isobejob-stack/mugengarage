"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerFormSchema, type CustomerFormValues } from "@/lib/crm/schema";
import { Button } from "@/components/ui/button";

// FR-CRM-001: 顧客情報編集フォーム
export function CustomerEditForm({
  customerId,
  defaultValues,
}: {
  customerId: string;
  defaultValues: CustomerFormValues;
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitError(null);
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error?.message ?? "保存に失敗しました");
      return;
    }

    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <label className="block">
        <span className="text-base font-medium text-charcoal-900">
          お名前
        </span>
        <input type="text" className="input mt-1" {...register("name")} />
        {errors.name && (
          <p className="mt-1 text-base text-red-600" role="alert">
            {errors.name.message}
          </p>
        )}
      </label>
      <label className="block">
        <span className="text-base font-medium text-charcoal-900">
          電話番号
        </span>
        <input type="text" className="input mt-1" {...register("phone")} />
      </label>
      <label className="block">
        <span className="text-base font-medium text-charcoal-900">
          メールアドレス
        </span>
        <input type="text" className="input mt-1" {...register("email")} />
        {errors.email && (
          <p className="mt-1 text-base text-red-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </label>
      <label className="block">
        <span className="text-base font-medium text-charcoal-900">備考</span>
        <textarea rows={3} className="input mt-1" {...register("notes")} />
      </label>
      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        variant="primary"
        size="md"
        className="self-start"
      >
        {isSubmitting ? "保存中..." : "保存する"}
      </Button>
    </form>
  );
}
