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
      className={`min-h-11 rounded-md border px-4 py-2 text-sm font-medium ${
        favorited
          ? "border-red-600 bg-red-50 text-red-600"
          : "border-neutral-300 text-neutral-700"
      } ${className}`}
    >
      {favorited ? "♥ お気に入り登録済み" : "♡ お気に入りに登録"}
    </button>
  );
}
