"use client";

import type { ReactNode } from "react";
import { Button, type ButtonSize } from "@/components/ui/button";

// InstagramのDM画面を開くボタン（lib/settings/sns.ts の dmUrl へ飛ぶ）。
//
// LINEなどは最初の文章を入れた状態でトークを開けるが、InstagramのDMはそれができない。車両ページから問い合わせた人が
// 「どの車のことか」を自分で打ち込む手間を減らすため、copyText を渡すと
// ボタンを押した時点で車名とURLをクリップボードに入れる。DM画面では貼り付けるだけで済む。
// コピーに失敗しても（権限が無い等）DM画面はそのまま開く。
//
// 色はInstagramのブランドカラー（マゼンタ）ではなく、サイトの主ボタンと同じ深緑にする。
// マゼンタは英国クラシックの落ち着いた配色から浮き、店主の評価も悪かった（2026-11-08）。
// 行き先がInstagramであることは、ボタン内のマークと文言で伝える。
export function InstagramDmButton({
  href,
  size = "md",
  className,
  copyText,
  children,
}: {
  href: string;
  size?: ButtonSize;
  className?: string;
  copyText?: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      variant="primary"
      size={size}
      className={className}
      onClick={() => {
        if (!copyText) return;
        navigator.clipboard?.writeText(copyText).catch(() => {});
      }}
    >
      <InstagramIcon className="h-5 w-5 flex-none" />
      <span>{children}</span>
    </Button>
  );
}

// Instagramのカメラ型のマーク（角丸の四角・円・右上の点）。文字の色に合わせて描く
export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
