"use client";

import { useRef, useState } from "react";
import { toEmbeddableVideoUrl } from "@/lib/inventory/video";
import { VehicleMediaLightbox } from "@/components/inventory/vehicle-media-lightbox";

type GalleryPhoto = { id: string; public_url: string };
type GalleryVideo = { id: string; video_url: string };

// FR-VEH-003: 写真ギャラリー表示（スマホ最適化・スワイプ対応）。FR-INV-010: 動画埋め込み表示。
// 横スクロール + scroll-snapによりJS無しでもスワイプに対応する（03_ui_rules.md 3章スマホファースト）。
// PC幅では左右の前へ/次へボタンとサムネイルのグリッド表示、拡大表示（ライトボックス）を追加する
// （UIUXデザイナーレビュー指摘 / 事業責任者判断：高額商材のためキズ・サビ等の状態確認が重要）。
export function VehicleMediaGallery({
  photos,
  videos,
  vehicleName,
}: {
  photos: GalleryPhoto[];
  videos: GalleryVideo[];
  // alt文字列生成に使う車両名（例：「Jaguar Eタイプ 1965年」）。呼び出し元で組み立てて渡す。
  vehicleName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  if (photos.length === 0 && videos.length === 0) {
    return null;
  }

  const buildAlt = (index: number) => {
    const prefix = vehicleName ? `${vehicleName} ` : "";
    return `${prefix}車両写真 ${index + 1}枚目`;
  };

  const scrollToIndex = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(photos.length - 1, nextIndex));
    setActiveIndex(clamped);
    itemRefs.current[clamped]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {photos.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-bold text-charcoal-900">写真</h2>
          <div className="relative mt-3">
            <div
              className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 pb-2"
              role="list"
              aria-label="車両写真ギャラリー"
            >
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  id={`photo-${photo.id}`}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="listitem"
                  className="flex-none snap-center scroll-mx-4"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setLightboxIndex(index);
                    }}
                    aria-label={`${buildAlt(index)}を拡大表示`}
                    className="rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storageの公開URLを直接表示するため */}
                    <img
                      src={photo.public_url}
                      alt={buildAlt(index)}
                      className="h-64 w-auto rounded-2xl object-cover shadow-soft sm:h-80"
                    />
                  </button>
                </div>
              ))}
            </div>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollToIndex(activeIndex - 1)}
                  disabled={activeIndex === 0}
                  aria-label="前の写真へ"
                  className="absolute top-1/2 left-2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white shadow-medium disabled:opacity-30 md:flex"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => scrollToIndex(activeIndex + 1)}
                  disabled={activeIndex === photos.length - 1}
                  aria-label="次の写真へ"
                  className="absolute top-1/2 right-2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white shadow-medium disabled:opacity-30 md:flex"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto md:grid md:grid-cols-6 md:gap-2 md:overflow-visible">
              {photos.map((photo, index) => (
                <a
                  key={photo.id}
                  href={`#photo-${photo.id}`}
                  onClick={() => setActiveIndex(index)}
                  className="block h-16 w-16 flex-none md:h-20 md:w-full"
                  aria-label={`${index + 1}枚目の写真を表示`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storageの公開URLを直接表示するため */}
                  <img
                    src={photo.public_url}
                    alt={buildAlt(index)}
                    className="h-16 w-16 rounded-lg border border-neutral-200 object-cover shadow-soft md:h-20 md:w-full"
                  />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-bold text-charcoal-900">動画</h2>
          <div className="mt-3 flex flex-col gap-4">
            {videos.map((video) => {
              const embedUrl = toEmbeddableVideoUrl(video.video_url);
              return (
                <div key={video.id}>
                  {embedUrl ? (
                    <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-soft">
                      <iframe
                        src={embedUrl}
                        title="車両動画"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  ) : (
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-base text-blue-600 underline"
                    >
                      動画を見る
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {lightboxIndex !== null && (
        <VehicleMediaLightbox
          photos={photos.map((photo, index) => ({
            id: photo.id,
            public_url: photo.public_url,
            alt: buildAlt(index),
          }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(nextIndex) => {
            setLightboxIndex(nextIndex);
            setActiveIndex(nextIndex);
          }}
        />
      )}
    </div>
  );
}
