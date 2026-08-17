import { getSiteSettings } from "@/lib/settings/queries";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EditableProse } from "@/components/live-edit/editable-prose";
import { SiteText } from "@/components/live-edit/site-text";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/site-config";

// 店舗情報（住所・電話）を本文に差し込むため、リクエストごとに描画する。
// 管理画面で店舗情報を入れた瞬間に、このページの記載も揃う。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "プライバシーポリシー",
  description: `${SITE_NAME}のプライバシーポリシーです。お問い合わせでお預かりする個人情報の取り扱い、サイトで使用するCookie、外部サービスへの委託についてご説明します。`,
  path: "/privacy",
});

// SCR-PUB-021: プライバシーポリシー
//
// 商用サイトとして必要なのはもちろんだが、この店の場合はそれ以上に、
// **問い合わせを増やすための条件**でもある。50〜60代の購買層が高額商材を扱う店に
// 名前と電話番号を渡すとき、その情報がどう扱われるか書かれていない店は避けられる。
//
// 記載内容は実装に基づく（推測で書かない）:
//   - お問い合わせフォーム（app/api/inquiries）が受け取るのは 名前・電話・メール・
//     相談区分・本文 の5項目。inquiries テーブルに保存し、customers と紐付けて管理する
//   - お気に入り（FR-FAV-001）は匿名のセッションID（Cookie: mg_session_id）だけで、
//     氏名等とは結び付かない
//   - アクセス解析ツールは導入していない（2026-08-17時点。Grepで確認済み）
//   - データの保管先は Supabase、ホスティングは Vercel
//
// 本文は <EditableProse> で持たせ、店主が管理画面から直せるようにしている。
// 事業者名・所在地のように「事実として正しく書く責任が発注者側にある」記述を、
// 開発者を介さないと直せない場所に置かないため。
export default async function Page() {
  const settings = await getSiteSettings();

  // 未入力の項目は「準備中」と書かず、その行ごと出さない。
  // 空欄や仮の文言が残っている個人情報の説明は、書かれていない以上に信用を損なう。
  const contactLines = [
    settings.address
      ? `所在地：${settings.postal_code ? `〒${settings.postal_code} ` : ""}${settings.address}`
      : null,
    settings.phone ? `電話：${settings.phone}` : null,
    settings.representative_name
      ? `代表者：${settings.representative_name}`
      : null,
  ].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb items={[{ label: "プライバシーポリシー" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        <SiteText k="privacy.title" description="プライバシーポリシー 見出し">
          プライバシーポリシー
        </SiteText>
      </h1>

      <div className="mt-8">
        <EditableProse
          k="privacy.body"
          description="プライバシーポリシーの本文"
        >
          {`${SITE_NAME}（以下「当店」）は、お客様の個人情報を適切に取り扱うことが事業者としての責務であると考えています。当ウェブサイトにおける個人情報の取り扱いについて、以下のとおり定めます。

## 1. お預かりする情報

当ウェブサイトでは、次の情報をお預かりします。

**お問い合わせフォームからご入力いただく情報**

- お名前
- お電話番号（任意）
- メールアドレス（任意）
- ご相談の区分（購入・修理・売却・部品・その他）
- お問い合わせ内容

お電話番号とメールアドレスは、ご返答のためにどちらか一方をご入力いただいています。

**お気に入り機能で使用する情報**

気になる車両を保存できる「お気に入り」機能では、ブラウザに保存される**匿名の識別子のみ**を使用します。お名前やご連絡先とは結び付きません。ログインも必要ありません。

**アクセスに関する情報**

サーバーの稼働記録として、アクセス日時・IPアドレス・ブラウザの種類などが自動的に記録されます。これらは障害時の原因調査に使用します。

## 2. 利用目的

お預かりした情報は、次の目的にのみ使用します。

- お問い合わせへのご返答、および商談・整備・お手続きのご連絡
- 車両のご提案や入荷のご案内（ご希望をうかがった場合）
- ウェブサイトの改善および障害対応

## 3. 第三者への提供

法令に基づく場合を除き、お客様の同意なく個人情報を第三者へ提供することはありません。

車両の名義変更・登録手続き・陸送など、お手続きに必要な範囲で関係先へ情報をお伝えする場合がありますが、その際は事前にご説明します。

## 4. 業務の委託

当ウェブサイトの運営にあたり、次の外部サービスを利用しています。いずれも情報の保管・処理を目的とした利用に限られます。

- **Supabase**（データベース・ファイル保管）
- **Vercel**（ウェブサイトの配信）

## 5. Cookie（クッキー）について

当ウェブサイトでは、次の目的でCookieを使用します。

- お気に入り機能で、同じブラウザからのアクセスを識別するため
- 管理画面へのログイン状態を保持するため（店舗スタッフ用）

**広告配信やアクセス解析を目的としたCookieは使用していません。** 第三者による行動追跡も行っていません。

Cookieはブラウザの設定で削除・拒否できます。その場合、お気に入り機能はご利用いただけなくなります。

## 6. 保存期間

お問い合わせいただいた内容は、ご相談の経緯を踏まえた対応を続けるために保管します。削除をご希望の場合は、下記の連絡先までお申し付けください。

## 7. 開示・訂正・削除のご請求

ご自身の個人情報について、開示・訂正・利用停止・削除をご希望の場合は、下記までご連絡ください。ご本人であることを確認のうえ、速やかに対応します。

## 8. お問い合わせ窓口

個人情報の取り扱いに関するお問い合わせは、下記までお願いします。

${contactLines.length > 0 ? contactLines.map((line) => `- ${line}`).join("\n") : `- ${SITE_NAME}（連絡先は「店舗情報・アクセス」ページをご覧ください）`}

## 9. 本ポリシーの変更

法令の改正やサービス内容の変更に応じて、本ポリシーを改定する場合があります。重要な変更がある場合は、当ウェブサイト上でお知らせします。`}
        </EditableProse>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3 border-t border-neutral-200 pt-8">
        <Button href="/contact" variant="primary" size="md">
          <SiteText
            k="privacy.cta.contact"
            description="プライバシーポリシー お問い合わせボタンの文言"
          >
            お問い合わせはこちら
          </SiteText>
        </Button>
        <Button href="/about" variant="outline" size="md">
          <SiteText
            k="privacy.cta.about"
            description="プライバシーポリシー 店舗情報ボタンの文言"
          >
            店舗情報・アクセス
          </SiteText>
        </Button>
      </div>
    </main>
  );
}
