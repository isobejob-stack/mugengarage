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
    // relative: ハニーポットをabsoluteで画面外に出すため、位置の基準をこのformに固定する
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="relative flex flex-col gap-5"
    >
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

      {/* ハニーポット。人間には見えず、スクリーンリーダーにも読まれず、
          Tabキーでも到達しないダミー欄。フォームを機械的に埋めるボットだけが値を入れるため、
          サーバー側で値の有無をスパム判定に使う（app/api/inquiries/route.ts）。
          display:none ではなく位置を画面外へ飛ばすのは、display:none の項目を
          無視するボットに気付かれにくくするため。 */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">
          この欄は入力しないでください
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </label>
      </div>

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
