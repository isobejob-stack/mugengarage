import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Zen_Old_Mincho,
  Zen_Kaku_Gothic_New,
} from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "M-GARAGE Platform",
  description:
    "クラシックJaguar専門店エムガレージの在庫・CRM・CMS統合プラットフォーム",
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
