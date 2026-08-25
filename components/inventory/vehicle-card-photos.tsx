import Image from "next/image";
import { CarIcon } from "@/components/ui/car-icon";

// 一覧カードの写真。数枚を横スワイプでめくれるようにする。
//
// 中古車探しは「一覧で気になった車の写真を何枚か見て、詳細に入るか決める」という進み方をする。
// 1枚しか出せないと、その判断のたびに詳細ページへの往復が発生していた。
//
// JavaScriptは使わず、横スクロール＋scroll-snap で実現している。
// カード全体が詳細ページへの <Link> になっているため、
// スワイプ用のJSを載せるとリンクのタップ判定と競合しやすい。
// ブラウザ標準のスクロールなら、指を滑らせればめくれ、
// 止めてタップすれば詳細へ進む、という挙動が自然に両立する。
export function VehicleCardPhotos({
  urls,
  alt,
  priority = false,
}: {
  urls: string[];
  alt: string;
  /** 一覧先頭のカードのみ true。LCPになりうる画像の遅延読み込みを外す */
  priority?: boolean;
}) {
  if (urls.length === 0) {
    return (
      <div className="bg-cream-200 text-foreground-muted flex aspect-[4/3] w-full flex-col items-center justify-center gap-2">
        <CarIcon className="h-10 w-10" />
        <span className="text-sm font-medium">写真準備中</span>
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <Image
          src={urls[0]}
          alt={alt}
          fill
          sizes="(min-width: 640px) 33vw, 50vw"
          priority={priority}
          className="ease-premium object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
      {/* overscroll-behavior-x: contain は、端まで来たスワイプが親（ページ）や
          iOSの「戻る」ジェスチャへ連鎖するのを止める。これが無いと、最後の写真で
          さらに滑らせたときにブラウザバックが暴発し、めくれないように感じる。
          scroll-smooth は外した。指の動きに追従すべき操作に補間が入ると、
          触っている量と動く量がずれて「反応が変」という印象になる。 */}
      <div className="flex h-full w-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {urls.map((url, index) => (
          <div
            key={url}
            className="relative h-full w-full flex-none snap-center"
          >
            <Image
              src={url}
              alt={index === 0 ? alt : `${alt} 写真${index + 1}枚目`}
              fill
              sizes="(min-width: 640px) 33vw, 50vw"
              priority={priority && index === 0}
              draggable={false}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* 以前はここに枚数ぶんのドットを並べ、常に1枚目を選択状態にしていた。
          スクロール位置と連動していないため、めくってもドットが動かない。
          「めくれていないように見える」原因になりうるので、嘘をつく表示はやめる
          （連動させるにはJSが要る。一覧は最大20枚のカードが並ぶ画面なので入れない）。

          枚数バッジは左上から右下へ移した。左上は status-badge.tsx の
          「おすすめ／新着」バッジ（absolute top-2 left-2 z-10）と同じ座標で、
          おすすめ車両では枚数バッジが完全に隠れていた。
          文言も「5枚」から「写真5枚」にする。何の枚数か分からなかったため。 */}
      <span className="bg-charcoal-900/75 pointer-events-none absolute right-2 bottom-2 rounded-full px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        写真{urls.length}枚
      </span>
    </div>
  );
}
