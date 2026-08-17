"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteNav } from "@/lib/site-config";
import { EditableText } from "@/components/live-edit/site-text-provider";

// グローバルナビゲーション。
//
// 従来はホバー時に下線が出るだけで、タップ操作にはホバーが存在しないため
// スマートフォンでは「押したかどうか」がまったく分からなかった。
// また現在地の表示も無く、どのページを見ているのか判別できなかった。
//
// 対応:
// - active: で押下中の視覚変化を出す（タップした瞬間のフィードバック）
// - 現在地は色・太字・下線 + aria-current="page" で示す（色だけに頼らない）
// - リンクの高さを44px確保する（03_ui_rules.md 4章のタップ領域基準）
const LINK_BASE =
  "inline-flex min-h-11 items-center rounded-lg px-2 transition-colors duration-200 ease-standard " +
  "hover:text-primary-700 hover:bg-primary-50 " +
  "active:bg-primary-100 active:text-primary-800 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 " +
  "motion-reduce:transition-none";

function linkClass(isCurrent: boolean) {
  return [
    LINK_BASE,
    isCurrent
      ? "font-bold text-primary-700 underline decoration-2 underline-offset-4"
      : "text-charcoal-800",
  ].join(" ");
}

export function SiteNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 現在地判定。詳細ページ（/blog/xxx）でも親の「ブログ」を現在地として扱う。
  // ただし "/" は全パスの接頭辞になってしまうため完全一致に限定する。
  const isCurrentPath = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  // メニュー外のタップ・Escで閉じる。開いたままスクロールされると
  // 何を操作しているのか分からなくなるため。
  useEffect(() => {
    if (openMenu === null) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  // ページ遷移したらメニューを閉じる。
  // useEffect内でsetStateするとカスケードレンダーになるため、
  // 「レンダー中にstateを調整する」パターンを使う
  // （components/inventory/manufacturer-model-fields.tsx と同じ考え方。
  //  https://react.dev/learn/you-might-not-need-an-effect）
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpenMenu(null);
  }

  return (
    <nav
      ref={menuRef}
      aria-label="サイト内メニュー"
      className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm"
    >
      {siteNav.map((item) => {
        if (!item.children) {
          const current = isCurrentPath(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={linkClass(current)}
            >
              {/* ナビゲーションの文言も編集対象にする。クライアントコンポーネントなので
                  サーバー版の <SiteText> は使えず、Provider経由の <EditableText> を使う。 */}
              <EditableText
                k={`nav${item.href.replaceAll("/", ".")}`}
                description={`ナビゲーション「${item.label}」の文言`}
              >
                {item.label}
              </EditableText>
            </Link>
          );
        }

        // 配下のいずれかを見ていれば、親も現在地として扱う
        const groupCurrent =
          isCurrentPath(item.href) ||
          item.children.some((child) => isCurrentPath(child.href));
        const isOpen = openMenu === item.label;

        return (
          <div key={item.label} className="relative">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => setOpenMenu(isOpen ? null : item.label)}
              className={`${linkClass(groupCurrent)} gap-1`}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={`ease-standard text-xs transition-transform duration-200 motion-reduce:transition-none ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="shadow-strong absolute left-0 z-40 mt-1 w-64 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <ul>
                  {item.children.map((child) => {
                    const childCurrent = isCurrentPath(child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={childCurrent ? "page" : undefined}
                          className={`ease-standard hover:bg-primary-50 active:bg-primary-100 block border-b border-neutral-100 px-4 py-3 transition-colors duration-200 last:border-b-0 motion-reduce:transition-none ${
                            childCurrent ? "bg-primary-50" : ""
                          }`}
                        >
                          <span
                            className={`block font-medium ${
                              childCurrent
                                ? "text-primary-700"
                                : "text-charcoal-900"
                            }`}
                          >
                            {child.label}
                          </span>
                          <span className="text-foreground-muted mt-0.5 block text-sm">
                            {child.description}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
