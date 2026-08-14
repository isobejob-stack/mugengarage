import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";

// 03_ui_rules.md 7章: グローバルヘッダーはロゴ・主要ナビ・LINE相談ボタンを常設する
// デザイン刷新: 常時 shadow-soft を出して面としての境界を明確にする（実装コストの低い常時表示を採用）
export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <header className="bg-surface shadow-soft border-b border-neutral-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link
          href="/"
          className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl"
        >
          M-GARAGE
        </Link>

        <SiteNav />

        <div className="flex items-center gap-3">
          <Button href="/favorites" variant="outline" size="md">
            ♡ お気に入り
          </Button>
          {/* LINEのURLが未設定のあいだはボタンを出さない。
              仮URLや空リンクへ飛ばすより、導線を見せないほうが利用者を裏切らない。 */}
          {settings.line_url && (
            <Button href={settings.line_url} variant="line" size="md">
              LINEで相談する
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
