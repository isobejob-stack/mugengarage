"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/admin/auth-card";
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
    <AuthCard title="ログイン" description="M-GARAGE Platform 管理画面">
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

        <Link
          href="/admin/forgot-password"
          className="text-primary-700 hover:text-primary-800 text-center text-base underline"
        >
          パスワードをお忘れですか？
        </Link>
      </form>
    </AuthCard>
  );
}
