import Link from "next/link";
import { siteNav, LINE_URL } from "@/lib/site-config";

// 03_ui_rules.md 7章: グローバルヘッダーはロゴ・主要ナビ・LINE相談ボタンを常設する
export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="text-lg font-bold">
          M-GARAGE
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {siteNav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/favorites"
            className="min-h-11 rounded-md border border-neutral-300 px-3 py-2 text-sm hover:border-neutral-500"
          >
            ♡ お気に入り
          </Link>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
          >
            LINEで相談する
          </a>
        </div>
      </div>
    </header>
  );
}
