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
import Link from "next/link";
import { Button } from "@/components/ui/button";

const contactMethodOptions = [
  { value: "phone", label: "電話で" },
  { value: "email", label: "メールで" },
] as const;

// SCR-PUB-017: 問い合わせフォーム
export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: emptyInquiryFormValues,
  });

  // 選ばれた連絡方法によって、入力欄のラベル・種類を切り替える
  const contactMethod = watch("contact_method");

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
      <div className="shadow-soft rounded-2xl border border-green-200 bg-green-50 p-6">
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

      {/* 連絡先は1つだけ受け取る。
          以前は電話番号とメールアドレスを並べて置いており、多くの人が
          両方を埋めて送っていた。返信に要るのは1つなので、残りは
          「使わないのに預かる情報」になる。預からなければ漏れようがない。 */}
      <fieldset>
        <legend className="text-charcoal-900 text-base font-medium">
          ご返信の方法
        </legend>
        <p className="text-foreground-muted mt-1 text-base">
          どちらか1つだけで結構です。ご記入いただいた方法でご連絡します。
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {contactMethodOptions.map((option) => {
            const isSelected = contactMethod === option.value;
            return (
              <label
                key={option.value}
                className={`ease-standard flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-base font-medium transition-colors duration-200 ${
                  isSelected
                    ? "border-primary-600 bg-primary-600 text-white"
                    : "text-charcoal-800 hover:border-primary-400 hover:bg-primary-50 border-neutral-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  value={option.value}
                  className="sr-only"
                  {...register("contact_method")}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field
        label={contactMethod === "email" ? "メールアドレス" : "電話番号"}
        error={errors.contact?.message}
      >
        {/* 連絡方法を切り替えたら入力値を持ち越さない（key で入れ替える）。
            電話番号の入力がメールアドレス欄に残ると、形式エラーの理由が
            本人には分からなくなる。 */}
        <input
          key={contactMethod}
          type={contactMethod === "email" ? "email" : "tel"}
          inputMode={contactMethod === "email" ? "email" : "tel"}
          autoComplete={contactMethod === "email" ? "email" : "tel"}
          className="input"
          {...register("contact")}
        />
      </Field>

      <Field label="お名前（任意）" error={errors.name?.message}>
        <p className="text-foreground-muted mb-1 text-base">
          折り返しの際の呼びかけに使います。空欄でも送信できます。
        </p>
        <input
          type="text"
          autoComplete="name"
          className="input"
          {...register("name")}
        />
      </Field>

      <Field label="お問い合わせ内容" error={errors.message?.message}>
        <textarea rows={6} className="input" {...register("message")} />
      </Field>

      {/* ハニーポット。人間には見えず、スクリーンリーダーにも読まれず、
          Tabキーでも到達しないダミー欄。フォームを機械的に埋めるボットだけが値を入れるため、
          サーバー側で値の有無をスパム判定に使う（app/api/inquiries/route.ts）。
          display:none ではなく位置を画面外へ飛ばすのは、display:none の項目を
          無視するボットに気付かれにくくするため。 */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
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

      {/* 名前と連絡先を渡す直前に、その情報がどう扱われるかへの導線を置く。
          高額商材ではここで手が止まる人が実際にいるため、
          フッターまで探させずに送信ボタンの手前で示す。 */}
      <p className="text-foreground-muted text-base">
        お預かりするのは、ご記入いただいた連絡先1つとご相談内容だけです。
        ご返答とご相談への対応にのみ使用します。詳しくは
        <Link
          href="/privacy"
          className="text-primary-700 mx-1 underline underline-offset-4"
        >
          プライバシーポリシー
        </Link>
        をご覧ください。
      </p>

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
      <span className="text-charcoal-900 text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
