import Link from "next/link";
import { SiteNav } from "@/components/layout/site-nav";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";
import { SiteText } from "@/components/live-edit/site-text";
import { InstagramDmButton } from "@/components/layout/instagram-dm-button";
import { findInstagramContact } from "@/lib/settings/sns";

// 03_ui_rules.md 7章: グローバルヘッダーはロゴ・主要ナビ・相談ボタンを常設する。
// 相談の窓口はInstagramのDMに統一した（2026-11-08、店主の判断。lib/settings/sns.ts）
// デザイン刷新: 常時 shadow-soft を出して面としての境界を明確にする（実装コストの低い常時表示を採用）
export async function SiteHeader() {
  const settings = await getSiteSettings();
  const instagram = findInstagramContact(settings.external_links);

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
            <SiteText
              k="header.favorites"
              description="ヘッダー お気に入りボタンの文言"
            >
              ♡ お気に入り
            </SiteText>
          </Button>
          {/* 店主いわく、InstagramのDMが最も返信が早い。どのページからでも1タップで届くよう常設する。
              管理画面の「掲載媒体・公式SNS」にInstagramが無いあいだは出さない（lib/settings/sns.ts）。 */}
          {instagram && (
            <InstagramDmButton instagram={instagram} size="md">
              <SiteText
                k="header.instagram"
                description="ヘッダー InstagramのDMボタンの文言"
              >
                InstagramでDM
              </SiteText>
            </InstagramDmButton>
          )}
        </div>
      </div>
    </header>
  );
}
