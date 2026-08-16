import type { ReactNode } from "react";

// 管理画面の認証系画面（ログイン／パスワード再設定）で共通のカード枠。
// SCR-ADM-001と同系統の画面が増えても見た目がずれないよう1箇所にまとめる
// （02_admin_ui_spec.md 1章: 文字・ボタンを大きく、入力欄のタップ範囲を広く取る）。
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-cream-50 flex min-h-screen items-center justify-center px-4 py-8">
      <div className="shadow-medium w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          {title}
        </h1>
        {description && (
          <p className="text-foreground-muted mt-2 text-base">{description}</p>
        )}
        {children}
      </div>
    </main>
  );
}
