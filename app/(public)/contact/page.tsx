import { InquiryForm } from "@/components/crm/inquiry-form";
import { InstagramDmButton } from "@/components/layout/instagram-dm-button";
import { InquiryChannels } from "@/components/layout/inquiry-channels";
import { SiteText } from "@/components/live-edit/site-text";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings/queries";
import { findInstagramContact } from "@/lib/settings/sns";

// 店舗情報（InstagramのURL・電話・メール）をDBから読むため、管理画面での変更が即反映されるようリクエストごとに描画する
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "お問い合わせ",
  description:
    "車両のご購入・整備・修理・買取のご相談を承ります。InstagramのDM・お電話・メール・フォームからお気軽にお問い合わせください。",
  path: "/contact",
});

// SCR-PUB-017: 問い合わせフォーム（FR-INQ-001）
//
// 問い合わせ窓口は InstagramのDM に統一した（2026-11-08、店主の判断）。
// メール・電話よりDMのほうが返信が早いため、いちばん上で案内する。
// Instagramを使っていない人のために電話・メールを添え、文章でじっくり伝えたい人向けに
// フォームも残す（フォームの内容は管理画面の「問い合わせ」に届く）。
// LINE・Threadsは窓口を増やして複雑にしないため使わない。
export default async function Page() {
  const settings = await getSiteSettings();
  const instagram = findInstagramContact(settings.external_links);
  const hasPhoneOrEmail = Boolean(settings.phone || settings.email);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        <SiteText k="contact.title" description="お問い合わせ 見出し">
          お問い合わせ
        </SiteText>
      </h1>
      <p className="text-foreground-muted mt-2">
        <SiteText k="contact.lead" description="お問い合わせ 冒頭の案内文">
          購入・修理・売却・部品・その他、Jaguarのことなら何でもご相談ください。
        </SiteText>
      </p>

      {/* 窓口が設定されていないあいだは、空の枠や存在しない導線を見せない */}
      {instagram && (
        <section className="shadow-soft mt-8 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold">
            <SiteText
              k="contact.instagram.heading"
              description="お問い合わせ InstagramのDMの見出し"
            >
              InstagramのDMがいちばん早くお返事できます
            </SiteText>
          </h2>
          <p className="text-foreground-muted mt-2 text-sm">
            <SiteText
              k="contact.instagram.body"
              description="お問い合わせ InstagramのDMの説明文"
            >
              在庫車両のこと、整備や買取のこと、ご来店のご相談など、お気軽にメッセージをお送りください。
            </SiteText>
          </p>
          <div className="mt-4">
            <InstagramDmButton href={instagram.dmUrl} size="lg">
              <SiteText
                k="contact.instagram.button"
                description="お問い合わせ InstagramのDMボタンの文言"
              >
                InstagramのDMで問い合わせる
              </SiteText>
            </InstagramDmButton>
          </div>
        </section>
      )}

      {hasPhoneOrEmail && (
        <section className="mt-8">
          <h2 className="text-charcoal-900 font-serif text-lg font-bold">
            {instagram ? (
              <SiteText
                k="contact.other.heading"
                description="お問い合わせ Instagramを使っていない方向けの見出し"
              >
                Instagramをお使いでない方
              </SiteText>
            ) : (
              <SiteText
                k="contact.phoneMail.heading"
                description="お問い合わせ 電話・メールの見出し（Instagramが未設定のとき）"
              >
                お電話・メール
              </SiteText>
            )}
          </h2>
          <InquiryChannels
            instagram={null}
            phone={settings.phone}
            email={settings.email}
            mailSubject="お問い合わせ（エムガレージ）"
          />
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-charcoal-900 font-serif text-lg font-bold">
          <SiteText
            k="contact.form.heading"
            description="お問い合わせ フォームの見出し"
          >
            フォームから問い合わせる
          </SiteText>
        </h2>
        <p className="text-foreground-muted mt-2 text-sm">
          <SiteText
            k="contact.form.lead.sns"
            description="お問い合わせ フォームへの案内文"
          >
            文章でじっくりお伝えになりたい方は、下記のフォームをご利用ください。
          </SiteText>
        </p>
        <div className="mt-4">
          <InquiryForm />
        </div>
      </section>
    </main>
  );
}
