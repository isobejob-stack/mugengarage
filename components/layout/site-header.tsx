import Link from "next/link";
import { siteNav, LINE_URL } from "@/lib/site-config";
import { Button } from "@/components/ui/button";

// 03_ui_rules.md 7章: グローバルヘッダーはロゴ・主要ナビ・LINE相談ボタンを常設する
// デザイン刷新: 常時 shadow-soft を出して面としての境界を明確にする（実装コストの低い常時表示を採用）
export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 bg-surface shadow-soft">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-lg font-bold text-charcoal-900">
          M-GARAGE
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {siteNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-charcoal-800 transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/favorites" variant="outline" size="md">
            ♡ お気に入り
          </Button>
          <Button href={LINE_URL} variant="line" size="md">
            LINEで相談する
          </Button>
        </div>
      </div>
    </header>
  );
}
