import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Zen_Old_Mincho,
  Zen_Kaku_Gothic_New,
} from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 見出し用（ヒーロー・セクションタイトル等）。日本語グリフのみのためsubsets指定不可。
// 日本語フォントは1ウェイトあたりの容量が英字フォントとは桁違いに大きいため、
// 実際に使っているウェイトだけを読み込む。900は全コード中で未使用だったため外した。
const zenOldMincho = Zen_Old_Mincho({
  variable: "--font-zen-old-mincho",
  weight: ["400", "700"],
  preload: false,
});

// 本文用。日本語グリフのみのためsubsets指定不可。900は未使用のため外した。
//
// 注意: このフォントは 300/400/500/700/900 しか持たず、600（font-semibold）が存在しない。
// CSSのフォントマッチングでは600の指定時に700へ繰り上がるため、コード中の font-semibold は
// font-bold と全く同じ太さで描画される（=強弱の差が出ない）。太さで階層を作りたい箇所では
// font-medium(500) と font-bold(700) を使い分けること。
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  preload: false,
});

// 従来この値は title「M-GARAGE Platform」/ description「…在庫・CRM・CMS統合プラットフォーム」
// だった。これは開発側から見たシステム名であり、車両詳細を除く全ページがこれを継承していたため、
// 検索結果やLINEでの共有時に、Jaguarを探している見込み客へ「CMS統合プラットフォーム」という
// 無関係な文言が表示されていた。店舗の顧客向け文言に置き換える。
//
// title.template: 各ページが title を設定すると「ページ名｜エムガレージ」となり、
// 未設定のページは default にフォールバックする。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "エムガレージ｜クラシックJaguar専門店",
    template: "%s｜エムガレージ",
  },
  description:
    "30年以上の実績を持つクラシックJaguar専門店エムガレージ。Eタイプ・XK・Mark2などの在庫車両、整備・修理・買取まで、Jaguarのことならご相談ください。",
  // LINEでの共有が最重要導線（FR-LINE-001）でありながらOGPが未設定で、
  // URLを送ってもプレビューが出ない状態だった。既定値をここで持たせ、
  // 各ページで上書きできるようにする。
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "エムガレージ",
    title: "エムガレージ｜クラシックJaguar専門店",
    description:
      "30年以上の実績を持つクラシックJaguar専門店。在庫車両・整備・修理・買取のご相談を承ります。",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${zenOldMincho.variable} ${zenKakuGothicNew.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
