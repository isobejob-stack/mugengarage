"use client";

import { useFavoriteToggle } from "@/components/engagement/favorite-button";

// FR-FAV-001: 一覧カード上のお気に入りボタン（ハートのみ）。
//
// 従来はお気に入りに入れるには車両詳細を開く必要があった。
// 中古車探しは「一覧で気になったものを片端からキープし、後で見返して絞る」
// という使い方が中心で、一覧から直接キープできないと
// 1台ごとに詳細へ入る→戻るの往復が発生する。
//
// カード全体が詳細ページへの <Link> になっているため、このボタンは
// リンクの内側ではなくカードの兄弟要素として重ねて置く（親のliを relative にする）。
// リンクの中にボタンを入れると入れ子の対話要素になり、
// スクリーンリーダーでの読み上げも「押せるものの中に押せるものがある」状態になる。
export function FavoriteIconButton({
  vehicleId,
  initialFavorited,
  vehicleName,
}: {
  vehicleId: string;
  initialFavorited: boolean;
  vehicleName: string;
}) {
  const { favorited, toggle } = useFavoriteToggle(vehicleId, initialFavorited);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      // 写真の明るさに関わらずハートが見えるよう、白い円を敷いた上に置く
      // （車両写真は明暗がまちまちで、写真に直接重ねると見えなくなることがある）
      className={`shadow-soft ease-standard absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full border transition-all duration-200 active:scale-95 ${
        favorited
          ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-neutral-200 bg-white/90 text-neutral-400 backdrop-blur-sm hover:border-red-200 hover:text-red-500"
      }`}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        {favorited ? "♥" : "♡"}
      </span>
      <span className="sr-only">
        {vehicleName}を
        {favorited ? "お気に入りから外す" : "お気に入りに登録する"}
      </span>
    </button>
  );
}
