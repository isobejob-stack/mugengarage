"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerFormSchema, type CustomerFormValues } from "@/lib/crm/schema";

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
        <span className="text-sm font-medium">お名前</span>
        <input type="text" className="input mt-1" {...register("name")} />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </label>
      <label className="block">
        <span className="text-sm font-medium">電話番号</span>
        <input type="text" className="input mt-1" {...register("phone")} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">メールアドレス</span>
        <input type="text" className="input mt-1" {...register("email")} />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </label>
      <label className="block">
        <span className="text-sm font-medium">備考</span>
        <textarea rows={3} className="input mt-1" {...register("notes")} />
      </label>
      {submitError && <p className="text-sm text-red-600">{submitError}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 self-start rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
