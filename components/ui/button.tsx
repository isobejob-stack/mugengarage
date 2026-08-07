import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

// 共有UIプリミティブ: Button（デザイン刷新プロジェクト フェーズ1）
// 03_ui_rules.md 4章: タップ領域は最低44px四方、本文は16px以上を確保する（sizeごとの min-h・text を参照）。
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "line";

export type ButtonSize = "sm" | "md" | "lg";

type ButtonSharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

// href未指定 = <button>としてレンダリング
type ButtonAsButtonProps = ButtonSharedProps &
  Omit<ComponentPropsWithoutRef<"button">, "className"> & {
    href?: undefined;
  };

// href指定 = 内部パスはnext/link、外部URL・mailto・telは<a>としてレンダリング
type ButtonAsAnchorProps = ButtonSharedProps &
  Omit<ComponentPropsWithoutRef<"a">, "className" | "href"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-standard select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white shadow-soft hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-medium active:translate-y-0 active:scale-[0.98] active:bg-primary-800",
  secondary:
    "bg-accent-500 text-charcoal-900 shadow-soft hover:bg-accent-600 hover:-translate-y-0.5 hover:shadow-medium active:translate-y-0 active:scale-[0.98]",
  outline:
    "border border-neutral-300 bg-white text-charcoal-900 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100",
  ghost:
    "bg-transparent text-charcoal-800 hover:bg-neutral-100 active:bg-neutral-200",
  destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  // LINE関連ボタン専用（LINE公式ブランドカラー）。primary/secondaryと混同しないよう独立させる。
  // 03_ui_rules.md 4章: 重要ボタン（LINE相談）はコントラストを高く保つ。
  // bg-[#06C755] × text-white は約2.3:1でWCAG AA未達のため、charcoal-900の文字色でAAを満たす（約7.4:1）。
  line: "bg-[#06C755] text-charcoal-900 shadow-soft hover:brightness-95 hover:-translate-y-0.5 hover:shadow-medium active:translate-y-0 active:scale-[0.98]",
};

// 既定(md)・ヒーローCTA(lg)は本文16px以上・44px以上のタップ領域を満たす。
// sm はタップ領域を確保した上で余白を詰めた表示用（44px以上・14px以上は維持）。
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm min-h-11",
  md: "px-5 py-3 text-base min-h-11",
  lg: "px-6 py-3 text-base min-h-12",
};

function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  return cx(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

function isExternalHref(href: string): boolean {
  return (
    /^https?:\/\//.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

export function Button(props: ButtonProps): ReactNode {
  const { variant = "primary", size = "md", className, href, ...rest } =
    props;
  const classes = buttonClassName({ variant, size, className });

  if (href !== undefined) {
    const anchorRest = rest as Omit<
      ComponentPropsWithoutRef<"a">,
      "className" | "href"
    >;
    if (isExternalHref(href)) {
      // 外部リンク（LINE等）は既定でtarget="_blank"・rel="noopener noreferrer"を付与する。
      // 呼び出し側でtarget/relを明示すればそちらを優先する（下でのスプレッドにより上書き可能）。
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...anchorRest}
        />
      );
    }
    return <Link href={href} className={classes} {...anchorRest} />;
  }

  const buttonRest = rest as Omit<
    ComponentPropsWithoutRef<"button">,
    "className"
  >;
  return <button className={classes} {...buttonRest} />;
}
