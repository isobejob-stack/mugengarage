"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({ notice }: { notice?: string }) {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitError(null);
    const supabase = createClient();

    // メール内のリンクは /api/auth/callback に着地し、そこでコードを
    // セッションに交換してから再設定画面へ遷移する（Supabase Auth PKCEフロー）。
    //
    // このURLはSupabaseの Redirect URLs 許可リストと照合される。照合はURL全体に対する
    // パターンマッチのため、クエリ文字列を付けると登録値（…/api/auth/callback）と
    // 一致しなくなる恐れがある。遷移先はコールバック側の既定値に任せ、ここでは
    // 許可リストに登録するURLと完全に同じ文字列を渡す（authentication.md 7.1）。
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    });

    if (error) {
      // 短時間に繰り返し送信するとSupabase側の送信制限に掛かる
      setSubmitError(
        "送信に失敗しました。1分ほど待ってからもう一度お試しください。",
      );
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="mt-8 flex flex-col gap-5">
        <p className="text-charcoal-900 text-base" role="status">
          パスワード再設定用のメールを送信しました。メールに記載されたリンクを開いて、新しいパスワードを設定してください。
        </p>
        <p className="text-foreground-muted text-base">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。それでも届かない場合は、入力したメールアドレスが登録済みのものと異なる可能性があります。
        </p>
        <Link
          href="/admin/login"
          className="text-primary-700 hover:text-primary-800 text-base underline"
        >
          ログイン画面に戻る
        </Link>
      </div>
    );
  }

  return (
    <>
      {notice && (
        <p className="mt-4 text-base text-red-600" role="alert">
          {notice}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-5"
      >
        <div>
          <label
            htmlFor="email"
            className="text-charcoal-900 block text-base font-medium"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input mt-1"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-base text-red-600" role="alert">
              {errors.email.message}
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
          {isSubmitting ? "送信中..." : "再設定用のメールを送る"}
        </Button>

        <Link
          href="/admin/login"
          className="text-primary-700 hover:text-primary-800 text-center text-base underline"
        >
          ログイン画面に戻る
        </Link>
      </form>
    </>
  );
}
