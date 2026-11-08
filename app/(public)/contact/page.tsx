import { InquiryForm } from "@/components/crm/inquiry-form";
import { LineConsultationMenu } from "@/components/layout/line-consultation-menu";
import { InstagramDmButton } from "@/components/layout/instagram-dm-button";
import { Button } from "@/components/ui/button";
import { findSnsContacts } from "@/lib/settings/sns";
import { SiteText } from "@/components/live-edit/site-text";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/queries";

// LINEのURLをDBから読むため、管理画面での変更が即反映されるようリクエストごとに描画する
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "お問い合わせ",
  description:
    "車両のご購入・整備・修理・買取のご相談を承ります。InstagramのDM・Threads・フォームからお気軽にお問い合わせください。",
  path: "/contact",
});

// SCR-PUB-017: 問い合わせフォーム（FR-INQ-001）
// レビュー指摘対応（修正2）: 冒頭の文中リンク（カテゴリなし・プリフィルなし）はLineConsultationMenuと
// 導線が重複していたため削除し、下部のカテゴリメニューへ視線を誘導する文言に変更した。
export default async function Page() {
  const settings = await getSiteSettings();
  // 店主いわく、メール・電話よりInstagramのDM・Threadsのほうが返信が早い（lib/settings/sns.ts）。
  // 管理画面の「掲載媒体・公式SNS」に登録があるときだけ、フォームより先に案内する。
  const sns = findSnsContacts(settings.external_links);
  const hasSns = Boolean(sns.instagram || sns.threads);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        <SiteText k="contact.title" description="お問い合わせ 見出し">
          お問い合わせ
        </SiteText>
      </h1>
      {/* LINEのURLが未設定のあいだ、LineConsultationMenu は何も描画しない。
          従来はそれを枠線付きのカードで囲み、さらに前後に「下記からLINEで」
          「LINEでのご相談は即時性が高く」という案内を残していたため、
          中身が空のカードと、存在しない導線への案内が2つ表示されていた。
          初めて訪れた人には「リンクが壊れているサイト」に見える。
          カード枠ごと、文言ごと、LINE URLの有無で切り替える。 */}
      <p className="text-foreground-muted mt-2">
        <SiteText k="contact.lead" description="お問い合わせ 冒頭の案内文">
          購入・修理・売却・部品・その他、Jaguarのことなら何でもご相談ください。
        </SiteText>
        {/* LINEの有無で続く一文が変わるため、文言も別々に持つ。
            1つにまとめると、片方を直したときにもう片方が置き去りになる。 */}
        {hasSns ? (
          <SiteText
            k="contact.lead.sns"
            description="お問い合わせ 冒頭の案内文（公式SNSがあるとき）"
          >
            お急ぎの方は、InstagramのDMかThreadsからどうぞ。いちばん早くお返事できます。
          </SiteText>
        ) : settings.line_url ? (
          <SiteText
            k="contact.lead.line"
            description="お問い合わせ 冒頭の案内文（LINEがあるとき）"
          >
            お急ぎの方は下記からLINEでご相談いただけます。
          </SiteText>
        ) : (
          <SiteText
            k="contact.lead.form"
            description="お問い合わせ 冒頭の案内文（LINEが未設定のとき）"
          >
            下記フォームよりお問い合わせください。
          </SiteText>
        )}
      </p>

      {hasSns && (
        <section className="shadow-soft mt-8 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold">
            <SiteText
              k="contact.sns.heading"
              description="お問い合わせ 公式SNSの見出し"
            >
              InstagramのDM・Threadsが早くお返事できます
            </SiteText>
          </h2>
          <p className="text-foreground-muted mt-2 text-sm">
            <SiteText
              k="contact.sns.body"
              description="お問い合わせ 公式SNSの説明文"
            >
              メールやお電話よりも早くお返事しています。在庫車両のこと、整備や買取のこと、ご来店のご相談など、お気軽にメッセージをお送りください。
            </SiteText>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {sns.instagram && (
              <InstagramDmButton href={sns.instagram.dmUrl} size="lg">
                <SiteText
                  k="contact.sns.instagram"
                  description="お問い合わせ InstagramのDMボタンの文言"
                >
                  InstagramのDMで問い合わせる
                </SiteText>
              </InstagramDmButton>
            )}
            {sns.threads && (
              <Button href={sns.threads.profileUrl} variant="threads" size="lg">
                <SiteText
                  k="contact.sns.threads"
                  description="お問い合わせ Threadsボタンの文言"
                >
                  Threadsで問い合わせる
                </SiteText>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* FR-LINE-002: カテゴリ別のLINE相談導線 */}
      {settings.line_url && (
        <>
          <div className="shadow-soft mt-8 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
            <LineConsultationMenu lineUrl={settings.line_url} />
          </div>
          <p className="text-foreground-muted mt-6 text-sm">
            <SiteText
              k="contact.form.lead"
              description="お問い合わせ フォームへの案内文"
            >
              LINEでのご相談は即時性が高くおすすめです。じっくり文章で伝えたい方は下記フォームをご利用ください。
            </SiteText>
          </p>
        </>
      )}

      {hasSns && !settings.line_url && (
        <p className="text-foreground-muted mt-8 text-sm">
          <SiteText
            k="contact.form.lead.sns"
            description="お問い合わせ フォームへの案内文（公式SNSがあるとき）"
          >
            文章でじっくりお伝えになりたい方は、下記のフォームをご利用ください。
          </SiteText>
        </p>
      )}

      <div className="mt-4">
        <InquiryForm />
      </div>
    </main>
  );
}
