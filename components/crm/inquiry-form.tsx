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
import { postJson } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

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

    // 従来は fetch を直接呼んでおり、送信中に電波が切れると例外が投げっぱなしになって
    // 「送信できていないのにエラーも出ない」状態になっていた。問い合わせの取りこぼしに
    // 直結するため、通信失敗も必ず画面上のメッセージとして返す（lib/api/client.ts）。
    const result = await postJson("/api/inquiries", values);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-soft">
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

      <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "送信する"}
      </Button>
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
      <span className="text-base font-medium text-charcoal-900">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
