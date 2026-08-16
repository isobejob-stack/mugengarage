"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// 顧客情報（CRM）を扱う管理画面のため、既定の6文字より強い下限を課す
// （03_non_functional_requirements.md 9章 セキュリティ要件）。
const MIN_PASSWORD_LENGTH = 12;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください`,
      ),
    passwordConfirmation: z
      .string()
      .min(1, "確認用のパスワードを入力してください"),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: "パスワードが一致しません",
    path: ["passwordConfirmation"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setSubmitError(null);
    const supabase = createClient();

    // /api/auth/callback で確立済みの回復用セッションに対して新パスワードを設定する
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setSubmitError(
        "パスワードを変更できませんでした。お手数ですが、もう一度メールの送信からやり直してください。",
      );
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 flex flex-col gap-5"
    >
      <div>
        <label
          htmlFor="password"
          className="text-charcoal-900 block text-base font-medium"
        >
          新しいパスワード
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="input mt-1"
          {...register("password")}
        />
        <p className="text-foreground-muted mt-1 text-base">
          {MIN_PASSWORD_LENGTH}文字以上で設定してください。
        </p>
        {errors.password && (
          <p className="mt-1 text-base text-red-600" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="passwordConfirmation"
          className="text-charcoal-900 block text-base font-medium"
        >
          新しいパスワード（確認）
        </label>
        <input
          id="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          className="input mt-1"
          {...register("passwordConfirmation")}
        />
        {errors.passwordConfirmation && (
          <p className="mt-1 text-base text-red-600" role="alert">
            {errors.passwordConfirmation.message}
          </p>
        )}
      </div>

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        variant="primary"
        size="lg"
        className="w-full justify-center"
      >
        {isSubmitting ? "変更中..." : "このパスワードに変更する"}
      </Button>
    </form>
  );
}
