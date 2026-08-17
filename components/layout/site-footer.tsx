import Link from "next/link";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";

// 03_ui_rules.md 7章: フッターでもLINE相談CTAを再掲する
// 店舗情報・掲載媒体リンクは管理画面から編集する（lib/settings/queries.ts）。
export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="bg-cream-100 mt-16 border-t border-neutral-200">
      <div className="text-charcoal-700 mx-auto max-w-5xl px-4 py-10 text-sm">
        <p className="text-charcoal-900 font-serif text-base font-medium">
          エムガレージ
        </p>
        <p className="text-foreground-muted mt-1">クラシックJaguar専門店</p>

        {/* 住所・電話番号は実店舗の信頼性に直結する情報のため、全ページのフッターに出す。
            未設定の項目は表示しない（空欄や誤情報を見せない）。 */}
        {(settings.address || settings.phone) && (
          <address className="text-foreground-muted mt-3 not-italic">
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
                  className="ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
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
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            店舗情報・アクセス
          </Link>
          <Link
            href="/owners-archive"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            オーナーズアーカイブ
          </Link>
          {/* 図鑑・ライブラリはグローバルナビから外し、本文中の用語リンクから引く位置づけに変えた
              （2026-08-17）。ただし一覧そのものへの入口が1つも無くなると、
              図鑑37件・用語31件・年表59件に「見に行く」手段が消える。
              探しに来た人だけが使う場所として、フッターに控えめに置く。 */}
          <Link
            href="/encyclopedia"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            Jaguar図鑑
          </Link>
          <Link
            href="/timeline"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            Jaguar年表
          </Link>
          <Link
            href="/library"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            用語ライブラリ
          </Link>
          <Link
            href="/contact"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            お問い合わせ
          </Link>
          {/* 個人情報の扱いを書いた場所への導線は、フォームの近くだけでなく
              全ページから届く位置に置く。高額商材で名前と電話番号を預ける判断は、
              問い合わせ画面に着く前から始まっているため。 */}
          <Link
            href="/privacy"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            プライバシーポリシー
          </Link>
          {settings.line_url && (
            <Button href={settings.line_url} variant="line" size="md">
              LINEで相談する
            </Button>
          )}
        </div>

        {/* 管理画面への入口。店主が公開サイトを見ていて「ここを直したい」と思ったときに、
            URLを手入力せずそのまま管理画面へ移れるようにする。
            来店客の目にも触れる位置のため、ヘッダーではなくフッターの控えめな扱いとする。
            未ログインでアクセスしてもproxy.tsがログイン画面へリダイレクトするため、
            リンクが見えること自体は権限上の問題にならない。 */}
        <div className="mt-6">
          <Link
            href="/admin"
            className="text-foreground-muted ease-standard hover:text-primary-700 active:text-primary-800 inline-flex min-h-11 items-center rounded-lg px-2 transition-colors duration-200 hover:underline motion-reduce:transition-none"
          >
            管理画面にログイン
          </Link>
        </div>

        {/* 公式SNS・掲載媒体への導線。既にInstagram等で発信している実績があり、
            サイトから相互にたどれることで、来訪者が実店舗の活動を確認できる
            （高額商材では「実在する店か」の確認が購買判断に直結するため）。 */}
        {settings.external_links.length > 0 && (
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <p className="text-charcoal-900 font-medium">公式SNS・掲載媒体</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {settings.external_links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
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
