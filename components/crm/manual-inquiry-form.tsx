"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emptyManualInquiryValues,
  inquiryCategoryLabels,
  inquiryChannelLabels,
  inquiryResponseStatusLabels,
  manualInquiryChannels,
  manualInquirySchema,
  type ManualInquiryValues,
} from "@/lib/crm/schema";
import { postJson } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

// FR-INQ-002: 電話・LINE・来店で受けた相談の手動登録（SCR-ADM-007から遷移）。
//
// 入力するのは接客の合間の運用者なので、既定値のまま「相談内容」だけ書けば
// 登録できる状態を目指し、任意項目は後回しにできるよう並べている。
export function ManualInquiryForm({
  customers,
}: {
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ManualInquiryValues>({
    resolver: zodResolver(manualInquirySchema),
    defaultValues: {
      ...emptyManualInquiryValues,
      // 顧客が1件も無い状態で「既存から選ぶ」を初期表示しても選べないため、
      // 既存顧客がいる場合だけそちらを既定にする（電話は常連客からが多い）。
      customer_mode: customers.length > 0 ? "existing" : "new",
    },
  });

  const customerMode = watch("customer_mode");

  const onSubmit = async (values: ManualInquiryValues) => {
    setSubmitError(null);

    const result = await postJson<{ id: string }>(
      "/api/admin/inquiries",
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    // 登録直後は「本当に記録されたか」を確かめたいので、一覧ではなく詳細へ送る
    router.push(`/admin/inquiries/${result.data.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="受付方法" error={errors.channel?.message}>
          <select className="input" {...register("channel")}>
            {manualInquiryChannels.map((channel) => (
              <option key={channel} value={channel}>
                {inquiryChannelLabels[channel]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="相談カテゴリ" error={errors.category?.message}>
          <select className="input" {...register("category")}>
            {Object.entries(inquiryCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="受付日時"
        hint="空欄の場合は登録した日時になります。あとからまとめて記録するときに入力してください。"
        error={errors.received_at?.message}
      >
        <input
          type="datetime-local"
          className="input"
          {...register("received_at")}
        />
      </Field>

      <fieldset className="rounded-lg border border-neutral-200 p-4">
        <legend className="text-charcoal-900 px-1 text-base font-medium">
          お客様
        </legend>

        <div className="flex flex-col gap-1">
          {customers.length > 0 && (
            <RadioOption
              label="登録済みのお客様から選ぶ"
              value="existing"
              {...register("customer_mode")}
            />
          )}
          <RadioOption
            label="新しいお客様として登録する"
            value="new"
            {...register("customer_mode")}
          />
          <RadioOption
            label="お客様を紐付けない（名前が分からない場合）"
            value="none"
            {...register("customer_mode")}
          />
        </div>

        {customerMode === "existing" && (
          <div className="mt-4">
            <Field label="お客様" error={errors.customer_id?.message}>
              <select className="input" {...register("customer_id")}>
                <option value="">選択してください</option>
                {customers.map((customer) => {
                  const contact = [customer.phone, customer.email]
                    .filter(Boolean)
                    .join(" / ");
                  return (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {contact ? `（${contact}）` : ""}
                    </option>
                  );
                })}
              </select>
            </Field>
          </div>
        )}

        {customerMode === "new" && (
          <div className="mt-4 flex flex-col gap-5">
            <Field label="お名前" error={errors.customer_name?.message}>
              <input
                type="text"
                className="input"
                {...register("customer_name")}
              />
            </Field>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="電話番号" error={errors.customer_phone?.message}>
                <input
                  type="tel"
                  className="input"
                  {...register("customer_phone")}
                />
              </Field>
              <Field
                label="メールアドレス"
                error={errors.customer_email?.message}
              >
                <input
                  type="email"
                  className="input"
                  {...register("customer_email")}
                />
              </Field>
            </div>
            <p className="text-foreground-muted text-base">
              同じ電話番号・メールアドレスのお客様が既に登録されている場合は、
              新しく作らずそのお客様に紐付けます。
            </p>
          </div>
        )}
      </fieldset>

      <Field
        label="相談内容"
        hint="聞き取った内容をそのまま残してください。あとで対応する人が読みます。"
        error={errors.message?.message}
      >
        <textarea rows={6} className="input py-2" {...register("message")} />
      </Field>

      <Field
        label="対応状況"
        hint="その場で解決した相談は「完了」にしてください。未対応のままだとダッシュボードに件数が残ります。"
        error={errors.response_status?.message}
      >
        <select className="input" {...register("response_status")}>
          {Object.entries(inquiryResponseStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
          {isSubmitting ? "登録中..." : "この内容で登録する"}
        </Button>
        <Button href="/admin/inquiries" variant="outline" size="md">
          やめる
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-charcoal-900 text-base font-medium">{label}</span>
      {hint && <span className="text-foreground-muted block text-base">{hint}</span>}
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-base text-red-600" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}

// ラジオボタン自体は小さいので、ラベル全体を44px以上の当たり判定にする（03_ui_rules.md 4章）。
// ComponentPropsWithRef なのは、react-hook-form の register() が返す ref を
// そのまま input へ渡す必要があるため（ref が欠けると値の同期が効かなくなる）。
function RadioOption({
  label,
  value,
  ...rest
}: { label: string; value: string } & React.ComponentPropsWithRef<"input">) {
  return (
    <label className="ease-standard hover:bg-primary-50 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-base transition-colors duration-200">
      <input type="radio" value={value} className="h-5 w-5" {...rest} />
      <span className="text-charcoal-900">{label}</span>
    </label>
  );
}
