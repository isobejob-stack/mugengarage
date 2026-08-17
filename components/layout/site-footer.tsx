import Link from "next/link";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";
import { SiteText } from "@/components/live-edit/site-text";

// 03_ui_rules.md 7章: フッターでもLINE相談CTAを再掲する
// 店舗情報・掲載媒体リンクは管理画面から編集する（lib/settings/queries.ts）。
export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="bg-cream-100 mt-16 border-t border-neutral-200">
      <div className="text-charcoal-700 mx-auto max-w-5xl px-4 py-10 text-sm">
        <p className="text-charcoal-900 font-serif text-base font-medium">
          <SiteText k="footer.shopName" description="フッター 店名">
            エムガレージ
          </SiteText>
        </p>
        <p className="text-foreground-muted mt-1">
          <SiteText k="footer.tagline" description="フッター 店名の下の一行">
            クラシックJaguar専門店
          </SiteText>
        </p>

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
            <SiteText k="footer.link.about" description="フッター 店舗情報リンクの文言">
              店舗情報・アクセス
            </SiteText>
          </Link>
          <Link
            href="/owners-archive"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            <SiteText k="footer.link.archive" description="フッター オーナーズアーカイブリンクの文言">
              オーナーズアーカイブ
            </SiteText>
          </Link>
          {/* 図鑑・ライブラリはグローバルナビから外し、本文中の用語リンクから引く位置づけに変えた
              （2026-08-17）。ただし一覧そのものへの入口が1つも無くなると、
              図鑑37件・用語31件・年表59件に「見に行く」手段が消える。
              探しに来た人だけが使う場所として、フッターに控えめに置く。 */}
          <Link
            href="/encyclopedia"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            <SiteText k="footer.link.encyclopedia" description="フッター 図鑑リンクの文言">
              Jaguar図鑑
            </SiteText>
          </Link>
          <Link
            href="/timeline"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            <SiteText k="footer.link.timeline" description="フッター 年表リンクの文言">
              Jaguar年表
            </SiteText>
          </Link>
          <Link
            href="/library"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            <SiteText k="footer.link.library" description="フッター 用語ライブラリリンクの文言">
              用語ライブラリ
            </SiteText>
          </Link>
          <Link
            href="/contact"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            <SiteText k="footer.link.contact" description="フッター お問い合わせリンクの文言">
              お問い合わせ
            </SiteText>
          </Link>
          {/* 個人情報の扱いを書いた場所への導線は、フォームの近くだけでなく
              全ページから届く位置に置く。高額商材で名前と電話番号を預ける判断は、
              問い合わせ画面に着く前から始まっているため。 */}
          <Link
            href="/privacy"
            className="text-charcoal-700 ease-standard hover:text-primary-700 transition-colors duration-200 hover:underline"
          >
            <SiteText k="footer.link.privacy" description="フッター プライバシーポリシーリンクの文言">
              プライバシーポリシー
            </SiteText>
          </Link>
          {settings.line_url && (
            <Button href={settings.line_url} variant="line" size="md">
              <SiteText k="footer.line" description="フッター LINE相談ボタンの文言">
                LINEで相談する
              </SiteText>
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
            <SiteText k="footer.adminLogin" description="フッター 管理画面リンクの文言">
              管理画面にログイン
            </SiteText>
          </Link>
        </div>

        {/* 公式SNS・掲載媒体への導線。既にInstagram等で発信している実績があり、
            サイトから相互にたどれることで、来訪者が実店舗の活動を確認できる
            （高額商材では「実在する店か」の確認が購買判断に直結するため）。 */}
        {settings.external_links.length > 0 && (
          <div className="mt-8 border-t border-neutral-200 pt-6">
            <p className="text-charcoal-900 font-medium">
            <SiteText k="footer.sns.heading" description="フッター SNS・掲載媒体の見出し">
              公式SNS・掲載媒体
            </SiteText>
          </p>
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
