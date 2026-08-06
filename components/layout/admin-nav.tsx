"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const adminNavItems = [
  { label: "ダッシュボード", href: "/admin" },
  { label: "車両", href: "/admin/vehicles" },
  { label: "ブログ", href: "/admin/articles" },
  { label: "図鑑", href: "/admin/encyclopedia" },
  { label: "年表", href: "/admin/timeline" },
  { label: "ライブラリ", href: "/admin/library" },
  { label: "整備実績", href: "/admin/maintenance-records" },
  { label: "問い合わせ", href: "/admin/inquiries" },
  { label: "顧客", href: "/admin/customers" },
] as const;

// 全管理画面共通のナビゲーション（03_ui_rules.md 7章：ステータスバッジ等と同様に横断コンポーネント化）
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "font-bold text-blue-600"
                    : "text-neutral-600 hover:underline"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
