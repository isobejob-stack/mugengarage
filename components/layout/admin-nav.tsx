"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AdminNavItem = { label: string; href: string };
type AdminNavGroup = { label: string; items: readonly AdminNavItem[] };

// 全管理画面共通のナビゲーション（03_ui_rules.md 7章：ステータスバッジ等と同様に横断コンポーネント化）
// 00_screen_list.md 5章のSCR-ADM-001〜025を「運用（毎日使う）」「コンテンツ」「設定」の3グループに整理し、
// 55歳・非エンジニアの運用者がどこに何があるか迷わないようにする。
// 各リンクは 03_ui_rules.md 4章（タップ領域44px以上・本文16px以上）を満たす。
const adminNavGroups: readonly AdminNavGroup[] = [
  {
    label: "運用",
    items: [
      { label: "ダッシュボード", href: "/admin" },
      { label: "車両", href: "/admin/vehicles" },
      { label: "問い合わせ", href: "/admin/inquiries" },
      { label: "顧客", href: "/admin/customers" },
    ],
  },
  {
    label: "コンテンツ",
    items: [
      { label: "ブログ", href: "/admin/articles" },
      { label: "図鑑", href: "/admin/encyclopedia" },
      { label: "年表", href: "/admin/timeline" },
      { label: "ライブラリ", href: "/admin/library" },
      { label: "整備実績", href: "/admin/maintenance-records" },
    ],
  },
  {
    label: "設定",
    items: [
      { label: "メディア", href: "/admin/media" },
      { label: "タグ", href: "/admin/tags" },
      { label: "テンプレート", href: "/admin/templates" },
      { label: "リダイレクト", href: "/admin/redirects" },
      { label: "監査ログ", href: "/admin/audit-logs" },
    ],
  },
] as const;

function isItemActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  // モバイルでは14項目・3グループの全展開が画面の大半を占有し、本来の目的である
  // 画面本体のコンテンツがその下に埋もれてしまうため、既定で折りたたんでおく
  // （ハンバーガーメニュー方式）。md以上（PC幅）では常時展開のまま変更しない。
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white shadow-soft">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/admin"
          className="font-serif text-lg font-bold text-charcoal-900"
        >
          M-GARAGE 管理画面
        </Link>
        <div className="flex items-center gap-2">
          <Button type="button" onClick={handleLogout} variant="outline" size="sm">
            ログアウト
          </Button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="admin-nav-menu"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-neutral-300 text-charcoal-800 md:hidden"
          >
            <span className="sr-only">メニューを開く</span>
            <span aria-hidden="true" className="text-xl leading-none">
              {isMobileMenuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      <div
        id="admin-nav-menu"
        className={`mx-auto max-w-6xl px-4 pb-3 ${isMobileMenuOpen ? "block" : "hidden"} md:block`}
      >
        {/* UIUXレビュー指摘: 14項目・3グループを常時横並びpillでflex-wrapすると
            375px幅で5〜6行に折り返り、ヘッダーがページ上部を過剰に占有してしまう。
            モバイルではハンバーガーメニューで既定は折りたたみ、開いた時は縦積みの
            1列リストにする。md以上（PC幅）では常時展開の横並びpill表示のまま。 */}
        <nav
          aria-label="管理メニュー"
          className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:gap-y-2"
        >
          {adminNavGroups.map((group, groupIndex) => (
            <div
              key={group.label}
              role="group"
              aria-label={`${group.label}メニュー`}
              className={`flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center ${
                groupIndex > 0
                  ? "border-t border-neutral-200 pt-3 md:ml-2 md:border-l md:border-t-0 md:pl-2 md:pt-0"
                  : ""
              }`}
            >
              <span
                aria-hidden="true"
                className="mb-1 mr-1 mt-1 text-sm font-semibold uppercase tracking-wide text-neutral-400 md:mt-0"
              >
                {group.label}
              </span>
              {group.items.map((item) => {
                const isActive = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex min-h-11 w-full items-center justify-start rounded-md px-3 text-base transition-colors duration-200 ease-standard md:w-auto md:justify-center ${
                      isActive
                        ? "bg-primary-50 font-semibold text-primary-700"
                        : "text-charcoal-700 hover:bg-neutral-100 hover:text-primary-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
