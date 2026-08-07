"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("メールアドレスの形式が正しくありません"),
  password: z.string().min(1, "パスワードを入力してください"),
});

type LoginForm = z.infer<typeof loginSchema>;

// SCR-ADM-001: 管理者ログイン（authentication.md 3章 Supabase Auth メール+パスワード方式）
export default function Page() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setLoginError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setLoginError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-4 py-8">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-medium">
        <h1 className="font-serif text-2xl font-bold text-charcoal-900">
          ログイン
        </h1>
        <p className="mt-2 text-base text-foreground-muted">
          M-GARAGE Platform 管理画面
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 flex flex-col gap-5"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-base font-medium text-charcoal-900"
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

          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-charcoal-900"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input mt-1"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-base text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {loginError && (
            <p className="text-base text-red-600" role="alert">
              {loginError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="w-full justify-center"
          >
            {isSubmitting ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </div>
    </main>
  );
}
