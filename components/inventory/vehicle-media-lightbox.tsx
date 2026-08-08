"use client";

import { useEffect } from "react";

export type LightboxPhoto = {
  id: string;
  public_url: string;
  alt: string;
};

// FR-VEH-003: 写真の拡大表示（ライトボックス）。事業責任者判断によりMVPスコープに追加
// （クラシックJaguarは高額商材のため、キズ・サビ・内装の状態を拡大確認できることが重要）。
// スマホのピンチズームはブラウザネイティブの挙動に任せるため、touch-action等でズームを禁止しない。
export function VehicleMediaLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[index];
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && index > 0) {
        onNavigate(index - 1);
      } else if (event.key === "ArrowRight" && index < photos.length - 1) {
        onNavigate(index + 1);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [index, photos.length, onClose, onNavigate]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="写真の拡大表示"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="閉じる"
        className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white shadow-medium hover:bg-white/20"
      >
        ×
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNavigate(index - 1);
          }}
          aria-label="前の写真へ"
          className="absolute top-1/2 left-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white shadow-medium hover:bg-black/70 md:left-4"
        >
          ‹
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onNavigate(index + 1);
          }}
          aria-label="次の写真へ"
          className="absolute top-1/2 right-2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white shadow-medium hover:bg-black/70 md:right-4"
        >
          ›
        </button>
      )}

      {/* ここだけは意図的に next/image を使わず、オリジナル画像をそのまま表示する。
          一覧・ギャラリー・サムネイルはnext/imageでAVIF/WebPへ再圧縮して転送量を削減しているが、
          拡大表示はキズ・サビ等の状態を確認するための画面であり（高額商材のため状態確認が重要、
          vehicle-media-gallery.tsx の設計判断を参照）、再圧縮で微細な質感が失われる余地を
          残したくない。利用者が明示的に拡大操作をしたときにのみ読み込まれるため、
          初期表示のパフォーマンスには影響しない。 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 上記の理由によりオリジナルを表示する */}
      <img
        src={photo.public_url}
        alt={photo.alt}
        className="max-h-full max-w-full rounded-xl object-contain shadow-strong"
        onClick={(event) => event.stopPropagation()}
      />

      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-base text-white/80">
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}
