"use client";

import { useEffect, useState } from "react";

type FavoriteChangedDetail = { vehicleId: string; favorited: boolean };

// SCR-PUB-003は同一車両のボタンを画面上部・下部の2箇所に置くため、
// カスタムイベントで同一vehicleIdのボタン間の表示状態を同期する
function broadcastFavoriteChanged(detail: FavoriteChangedDetail) {
  window.dispatchEvent(
    new CustomEvent<FavoriteChangedDetail>("favorite-changed", { detail }),
  );
}

// FR-VEH-006 / FR-FAV-001: 車両ページのお気に入りボタン
export function FavoriteButton({
  vehicleId,
  initialFavorited,
  className = "",
}: {
  vehicleId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const { detail } = event as CustomEvent<FavoriteChangedDetail>;
      if (detail.vehicleId === vehicleId) {
        setFavorited(detail.favorited);
      }
    };
    window.addEventListener("favorite-changed", handler);
    return () => window.removeEventListener("favorite-changed", handler);
  }, [vehicleId]);

  const handleClick = async () => {
    if (pending) return;
    setPending(true);
    const next = !favorited;
    setFavorited(next);

    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicle_id: vehicleId }),
    });

    if (!res.ok) {
      setFavorited(!next);
    } else {
      const body = await res.json();
      setFavorited(body.data.favorited);
      broadcastFavoriteChanged({ vehicleId, favorited: body.data.favorited });
    }
    setPending(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      // 共有Buttonコンポーネントのoutline variantをベースに、お気に入り状態の色のみ差し替える
      // （03_ui_rules.md 4章: 重要ボタンはタップ領域44px以上・コントラストを高く保つ）
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-5 py-3 text-base font-medium shadow-soft transition-all duration-200 ease-standard active:scale-[0.98] ${
        favorited
          ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-100"
          : "border-neutral-300 bg-white text-charcoal-900 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100"
      } ${className}`}
    >
      {favorited ? "♥ お気に入り登録済み" : "♡ お気に入りに登録"}
    </button>
  );
}
