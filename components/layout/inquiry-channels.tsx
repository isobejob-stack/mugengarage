import type { ReactNode } from "react";
import { Button, type ButtonSize } from "@/components/ui/button";
import { SiteText } from "@/components/live-edit/site-text";
import { InstagramDmButton } from "@/components/layout/instagram-dm-button";
import type { InstagramContact } from "@/lib/settings/sns";
import { buildMailtoUrl } from "@/lib/settings/mailto";

// 問い合わせ窓口（2026-11-08、店主の判断）。
//
// 窓口は InstagramのDM に統一する（メール・電話より返信が早いため）。
// Instagramを使っていない人のために、電話とメールを「お使いでない方は」として添える。
// どのページでも同じ並び・同じ言い方にするため、問い合わせの入口はこの部品にまとめる。
//
// 各窓口は管理画面で設定されたものだけを出す（Instagramは「掲載媒体・公式SNS」、
// 電話・メールは店舗情報）。1つも無ければ何も描画しない。
export async function InquiryChannels({
  instagram,
  phone,
  email,
  size = "md",
  instagramLabel,
  instagramHint,
  copyText,
  mailSubject,
  mailBody,
  className,
}: {
  instagram: InstagramContact | null;
  phone: string | null;
  email: string | null;
  size?: ButtonSize;
  /** 場所ごとにボタンの文言を変えたいとき（例: 車両詳細の「この車を…」） */
  instagramLabel?: ReactNode;
  /** InstagramのDMボタンのすぐ下に出す案内（例: 押すと車名がコピーされること） */
  instagramHint?: ReactNode;
  /** InstagramのDMボタンを押したときにコピーする文章（車名とURLなど） */
  copyText?: string;
  /** メールの件名・本文の書き出し（車両詳細では車名とURLを入れておく） */
  mailSubject?: string;
  mailBody?: string;
  className?: string;
}) {
  if (!instagram && !phone && !email) return null;

  return (
    <div className={className}>
      {instagram && (
        <InstagramDmButton
          instagram={instagram}
          size={size}
          copyText={copyText}
        >
          {instagramLabel ?? (
            <SiteText
              k="inquiry.instagram"
              description="問い合わせ窓口 InstagramのDMボタンの文言（共通）"
            >
              InstagramのDMで問い合わせる
            </SiteText>
          )}
        </InstagramDmButton>
      )}
      {instagram && instagramHint && (
        <p className="text-foreground-muted mt-2 text-sm">{instagramHint}</p>
      )}

      {(phone || email) && (
        <div className={instagram ? "mt-4" : undefined}>
          {instagram && (
            <p className="text-foreground-muted text-sm">
              <SiteText
                k="inquiry.fallback.lead"
                description="問い合わせ窓口 Instagramを使っていない方への案内（共通）"
              >
                Instagramをお使いでない方は、お電話・メールでも承ります。
              </SiteText>
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            {phone && (
              // 電話・メールはアプリを開くだけなので、新しいタブ（空のタブが残る）にしない
              <Button
                href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                variant="outline"
                size="md"
                target="_self"
              >
                電話 {phone}
              </Button>
            )}
            {email && (
              <Button
                href={buildMailtoUrl(email, mailSubject, mailBody)}
                variant="outline"
                size="md"
                target="_self"
                className="break-all"
              >
                メール {email}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
