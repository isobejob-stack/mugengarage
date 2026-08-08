import Link from "next/link";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";

// 03_ui_rules.md 7章: フッターでもLINE相談CTAを再掲する
// 店舗情報・掲載媒体リンクは管理画面から編集する（lib/settings/queries.ts）。
export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="mt-16 border-t border-neutral-200 bg-cream-100">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-charcoal-700">
        <p className="font-serif text-base font-medium text-charcoal-900">
          エムガレージ
        </p>
        <p className="mt-1 text-foreground-muted">クラシックJaguar専門店</p>

        {/* 住所・電話番号は実店舗の信頼性に直結する情報のため、全ページのフッターに出す。
            未設定の項目は表示しない（空欄や誤情報を見せない）。 */}
        {(settings.address || settings.phone) && (
          <address className="mt-3 not-italic text-foreground-muted">
            {settings.address && (
              <p>
                {settings.postal_code && `〒${settings.postal_code} `}
                {settings.address}
              </p>
            )}
            {settings.phone && (
              <p className="mt-1">
                TEL:{" "}
                {/* 電話は最も確実な連絡手段。スマートフォンからそのまま発信できるようにする */}
                <a
                  href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                  className="transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
                >
                  {settings.phone}
                </a>
              </p>
            )}
            {settings.business_hours && (
              <p className="mt-1">営業時間: {settings.business_hours}</p>
            )}
            {settings.closed_days && <p>定休日: {settings.closed_days}</p>}
          </address>
        )}

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
          {settings.line_url && (
            <Button href={settings.line_url} variant="line" size="md">
              LINEで相談する
            </Button>
          )}
        </div>

        {/* 公式SNS・掲載媒体への導線。既にInstagram等で発信している実績があり、
            サイトから相互にたどれることで、来訪者が実店舗の活動を確認できる
            （高額商材では「実在する店か」の確認が購買判断に直結するため）。 */}
        {settings.external_links.length > 0 && (
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <p className="font-medium text-charcoal-900">公式SNS・掲載媒体</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {settings.external_links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-charcoal-700 transition-colors duration-200 ease-standard hover:text-primary-700 hover:underline"
                  >
                    {link.label}
                    <span className="sr-only">
                      （外部サイトを新しいタブで開きます）
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}
