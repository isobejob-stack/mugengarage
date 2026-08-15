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
      <div className="flex h-full w-full snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* 何枚あるかを示す。ドットが無いと、そもそもめくれることに気付かれない。
          スクロール位置との連動はJSが要るため、ここでは枚数の提示に留める。 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {urls.map((url, index) => (
          <span
            key={url}
            className={`block h-1.5 rounded-full bg-white shadow-sm ${
              index === 0 ? "w-4" : "w-1.5 opacity-70"
            }`}
          />
        ))}
      </div>
      <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
        {urls.length}枚
      </span>
    </div>
  );
}
