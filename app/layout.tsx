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
const zenOldMincho = Zen_Old_Mincho({
  variable: "--font-zen-old-mincho",
  weight: ["400", "700", "900"],
  preload: false,
});

// 本文用。日本語グリフのみのためsubsets指定不可。
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700", "900"],
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
