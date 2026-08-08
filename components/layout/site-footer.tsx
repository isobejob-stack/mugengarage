import Link from "next/link";
import { EXTERNAL_LINKS, LINE_URL } from "@/lib/site-config";
import { Button } from "@/components/ui/button";

// 03_ui_rules.md 7章: フッターでもLINE相談CTAを再掲する
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-cream-100">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-charcoal-700">
        <p className="font-serif text-base font-medium text-charcoal-900">
          エムガレージ
        </p>
        <p className="mt-1 text-foreground-muted">クラシックJaguar専門店</p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/about"
            className="text-charcoal-700 transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
          >
            店舗情報・アクセス
          </Link>
          <Link
            href="/owners-archive"
            className="text-charcoal-700 transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
          >
            オーナーズアーカイブ
          </Link>
          <Link
            href="/contact"
            className="text-charcoal-700 transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
          >
            お問い合わせ
          </Link>
          <Button href={LINE_URL} variant="line" size="md">
            LINEで相談する
          </Button>
        </div>

        {/* 公式SNS・掲載媒体への導線。既にInstagram等で発信している実績があり、
            サイトから相互にたどれることで、来訪者が実店舗の活動を確認できる
            （高額商材では「実在する店か」の確認が購買判断に直結するため）。 */}
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <p className="font-medium text-charcoal-900">
            公式SNS・掲載媒体
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {EXTERNAL_LINKS.map((link) => (
              <li key={link.id}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-charcoal-700 transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
                >
                  {link.label}
                  <span className="sr-only">（外部サイトを新しいタブで開きます）</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
