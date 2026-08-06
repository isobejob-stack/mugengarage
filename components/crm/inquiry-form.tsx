"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  inquiryFormSchema,
  emptyInquiryFormValues,
  inquiryCategoryLabels,
  type InquiryFormValues,
} from "@/lib/crm/schema";

// SCR-PUB-017: 問い合わせフォーム
export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: emptyInquiryFormValues,
  });

  const onSubmit = async (values: InquiryFormValues) => {
    setSubmitError(null);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setSubmitError(body?.error?.message ?? "送信に失敗しました");
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-6">
        <p className="font-medium text-green-800">
          お問い合わせありがとうございます。担当者より折り返しご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Field label="相談カテゴリ">
        <select className="input" {...register("category")}>
          {Object.entries(inquiryCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="お名前" error={errors.name?.message}>
        <input type="text" className="input" {...register("name")} />
      </Field>

      <Field label="電話番号" error={errors.phone?.message}>
        <input type="tel" className="input" {...register("phone")} />
      </Field>

      <Field label="メールアドレス" error={errors.email?.message}>
        <input type="email" className="input" {...register("email")} />
      </Field>

      <Field label="お問い合わせ内容" error={errors.message?.message}>
        <textarea rows={6} className="input" {...register("message")} />
      </Field>

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-11 rounded-md bg-blue-600 px-5 py-2 font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "送信中..." : "送信する"}
      </button>
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
