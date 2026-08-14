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
    <main className="bg-cream-50 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="shadow-medium w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          ログイン
        </h1>
        <p className="text-foreground-muted mt-2 text-base">
          M-GARAGE Platform 管理画面
        </p>

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

          <div>
            <label
              htmlFor="password"
              className="text-charcoal-900 block text-base font-medium"
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
