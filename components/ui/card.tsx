import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CarIcon } from "@/components/ui/car-icon";

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

// 枠線は cream-200（暖色）にする。背景は cream-50（暖色）、カード面は純白なので、
// そこへ寒色の neutral-200 を1本入れると「カードの縁」ではなく「継ぎ目・隙間」に見える。
const CARD_BASE_CLASSES =
  "group relative overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-soft transition-[translate,box-shadow,border-color] duration-300 ease-premium";

// ホバーリフト演出はクリック可能（href指定）な場合のみ付与する。
// 静的なコンテナ（テーブルのラッパー、フォームのセクション等）に付けると、
// 操作できないのに操作できそうに見える誤ったアフォーダンスになるため（UIUXレビュー指摘）。
//
// 押下フィードバックの作り直し（2026-08-25）:
// 発注者から「ボタンを押した感じが、空白線が色変わる程度で全然体験よくない」と指摘。
// 調べたところ、これは実装の正確な描写だった。
//
//   - Tailwind v4 の hover: は @media (hover: hover) の中に出る（ビルド後のCSSで確認済み）。
//     つまりスマホでは hover:-translate-y-1 も hover:shadow-medium も**発火しない**。
//   - 発火しないものを打ち消す active:translate-y-0 / active:shadow-soft は無効。
//   - active:scale-[0.98] は幅170pxのカードで片側1.7px。しかも**指の下**で起きる。
//   - 結果、スマホで実際に変化していたのは枠線1pxの色だけ。カード面積の約2%。
//
// 直し方は「線ではなく面を変える」。::after でカード全面に暗いヴェールを掛け、
// 縁には真鍮（accent）の内側リングを出す。理由:
//   - 面は指に隠れない（指が覆うのは面積の3割程度）
//   - 縁は絶対に指に隠れない
//   - 車両写真は明暗がまちまちで、暗い写真ではヴェールの効きが弱まる。
//     不透明な真鍮リングは写真の明暗に一切左右されないので、効き目の下限を保証できる
//
// scale（縮小）は意図的に入れていない。写真エリアはカード内で横スクロールする領域で、
// スワイプを始めた瞬間にブラウザが :active を一度乗せる。そこでカードが縮むと、
// めくる操作そのものを邪魔しかねない（発注者から当たり判定の指摘も出ている）。
// 面と縁だけで十分に伝わるため、動く表現は使わない。
// この判断の副産物として prefers-reduced-motion でも表現が変わらない。
//
// 入り90ms・戻り200msの非対称にしている。押している最中は指がカードを覆っていて、
// 実際に見えるのは指を離した後。戻りが速すぎると「離したときには消えていた」になる。
const CARD_INTERACTIVE_CLASSES = [
  "select-none",
  "hover:-translate-y-1 hover:shadow-medium hover:border-primary-200",
  "active:border-accent-500",
  // キーボード操作時の現在位置。Buttonには元からあるがCardには無かった
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  // 押下時のヴェールと真鍮リング。pointer-events-none で写真のスワイプを妨げない
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl",
  "after:bg-primary-900/20 after:inset-ring-2 after:inset-ring-accent-400",
  "after:opacity-0 after:transition-opacity after:duration-200 after:ease-out",
  "active:after:opacity-100 active:after:duration-[90ms]",
].join(" ");

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
          <CarIcon className="h-10 w-10" />
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
    // 12pxだった。支払総額か本体価格かを決める行で、03_ui_rules.md 4章の
    // 本文16px基準に対して明確に不足していた（主要購買層は50〜60代）。
    <p className={cx("text-foreground-muted text-sm sm:text-base", className)}>
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
        "text-primary-700 font-mono text-lg font-bold tabular-nums sm:text-xl",
        className,
      )}
    >
      {children}
    </p>
  );
}
