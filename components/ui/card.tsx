import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

// 共有UIプリミティブ: Card（デザイン刷新プロジェクト フェーズ1）
// 車両カード（画像あり）・図鑑/年表カード（画像なし）の双方に対応するサブコンポーネント構成。
// 既存の `rounded-md border border-neutral-200 p-4 hover:border-neutral-400` パターンの置き換え先。

type CardOwnProps = {
  className?: string;
  children: ReactNode;
};

type CardAsDivProps = CardOwnProps &
  Omit<ComponentPropsWithoutRef<"div">, "className" | "children"> & {
    href?: undefined;
  };

type CardAsLinkProps = CardOwnProps &
  Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "className" | "children" | "href"
  > & {
    href: string;
  };

export type CardProps = CardAsDivProps | CardAsLinkProps;

const CARD_BASE_CLASSES =
  "group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft transition-all duration-300 ease-premium";

// ホバーリフト演出はクリック可能（href指定）な場合のみ付与する。
// 静的なコンテナ（テーブルのラッパー、フォームのセクション等）に付けると、
// 操作できないのに操作できそうに見える誤ったアフォーダンスになるため（UIUXレビュー指摘）。
const CARD_INTERACTIVE_CLASSES =
  "hover:-translate-y-1 hover:shadow-medium hover:border-primary-200";

function cx(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(" ");
}

// Card: コンテナ。href を渡すとリンクカード（車両一覧・図鑑一覧等）になり、ホバー演出も付く。
export function Card(props: CardProps): ReactNode {
  const { className, children, href, ...rest } = props;
  const classes = cx(
    CARD_BASE_CLASSES,
    href !== undefined && CARD_INTERACTIVE_CLASSES,
    className,
  );

  if (href !== undefined) {
    const linkRest = rest as Omit<
      ComponentPropsWithoutRef<typeof Link>,
      "className" | "children" | "href"
    >;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const divRest = rest as Omit<
    ComponentPropsWithoutRef<"div">,
    "className" | "children"
  >;
  return (
    <div className={classes} {...divRest}>
      {children}
    </div>
  );
}

// CardImage: 車両カード等、画像ありパターン用。4:3のトリミング＋hoverで軽くズーム。
// src未指定（写真未登録）の場合は、共通のフォールバックUI（車のシルエット＋案内文）を表示する。
//
// priority: 一覧の先頭（ファーストビューに入る）カードにのみ true を渡す。
// LCP（Largest Contentful Paint）になりうる画像の遅延読み込みを外し、表示を前倒しする。
// 画面外のカードまで true にすると帯域を奪い合って逆効果になるため、先頭数枚に限ること。
export function CardImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}): ReactNode {
  return (
    <div
      className={cx(
        "relative aspect-[4/3] w-full overflow-hidden bg-neutral-100",
        className,
      )}
    >
      {src ? (
        // next/imageでAVIF/WebP変換・端末幅に応じたリサイズ・遅延読み込みを行う。
        // 車両写真は一眼で撮った数MBのJPEGがそのまま登録されうるため、生の<img>だと
        // スマートフォンにもフルサイズが届いてしまう。
        // fill + aspect比固定の親要素により、読み込み完了前後でレイアウトが動かない（CLS対策）。
        <Image
          src={src}
          alt={alt}
          fill
          // カードは「モバイル=全幅 / sm以上=3カラム」で表示される。実際に必要な解像度だけを
          // 配信するため、ブラウザに選択させる候補幅のヒントを与える。
          sizes="(min-width: 640px) 33vw, 100vw"
          priority={priority}
          className="ease-premium object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div className="bg-cream-200 text-foreground-muted flex h-full w-full flex-col items-center justify-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <path d="M3.5 13.5l1.4-4.3A2 2 0 0 1 6.8 7.8h10.4a2 2 0 0 1 1.9 1.4l1.4 4.3" />
            <rect x="2.5" y="13.5" width="19" height="4.5" rx="1.5" />
            <circle cx="7" cy="18" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="17" cy="18" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-sm font-medium">写真準備中</span>
        </div>
      )}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactNode {
  return <div className={cx("space-y-2 p-6", className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <p className={cx("text-charcoal-900 text-lg font-semibold", className)}>
      {children}
    </p>
  );
}

export function CardMeta({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <p className={cx("text-foreground-muted text-base", className)}>
      {children}
    </p>
  );
}

export function CardPrice({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <p
      className={cx(
        "text-primary-700 font-mono text-xl font-bold tabular-nums",
        className,
      )}
    >
      {children}
    </p>
  );
}
