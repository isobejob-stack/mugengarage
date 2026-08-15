"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// 写真のトリミング（範囲選択）。
//
// 公開サイトのカードは 4:3 に切り抜いて表示している（object-cover）。
// つまり縦長・横長の写真を登録すると、中央付近が機械的に切り取られ、
// 車体の一部が切れたり、狙った構図と違う見え方になったりする。
// どこを見せるかは撮った人にしか判断できないため、店主が指定できるようにする。
//
// 保存時はブラウザ内で切り抜いた画像を作り、その写真を差し替える
// （新しいStorageパスへ保存し、行の storage_path を差し替える。並び順は保たれる）。

/** 切り抜き比率。公開カードと同じ 4:3 を既定にする。 */
const ASPECT_PRESETS = [
  { label: "4:3（一覧カードと同じ）", value: 4 / 3 },
  { label: "16:9（横長）", value: 16 / 9 },
  { label: "1:1（正方形）", value: 1 },
] as const;

type Rect = { x: number; y: number; w: number; h: number };

export function VehiclePhotoCropper({
  imageUrl,
  onCancel,
  onSave,
  saving,
}: {
  imageUrl: string;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
  saving: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState<number>(ASPECT_PRESETS[0].value);
  // 表示上の切り抜き枠（フレーム基準のpx）
  const [rect, setRect] = useState<Rect | null>(null);
  const [size, setSize] = useState(90); // 枠の大きさ（%）
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);

  // 画像の表示サイズが決まってから、中央に最大の枠を置く
  const layout = (nextSize = size, nextAspect = aspect) => {
    const frame = frameRef.current;
    if (!frame) return;
    const fw = frame.clientWidth;
    const fh = frame.clientHeight;
    if (fw === 0 || fh === 0) return;

    // 指定比率で枠内に収まる最大サイズを求め、そこに size(%) を掛ける
    let w = fw;
    let h = w / nextAspect;
    if (h > fh) {
      h = fh;
      w = h * nextAspect;
    }
    w *= nextSize / 100;
    h *= nextSize / 100;

    setRect((prev) => {
      // 既存の位置をなるべく保つ（中心を維持したまま大きさだけ変える）
      const cx = prev ? prev.x + prev.w / 2 : fw / 2;
      const cy = prev ? prev.y + prev.h / 2 : fh / 2;
      return clamp({ x: cx - w / 2, y: cy - h / 2, w, h }, fw, fh);
    });
  };

  const clamp = (r: Rect, fw: number, fh: number): Rect => ({
    w: r.w,
    h: r.h,
    x: Math.min(Math.max(0, r.x), Math.max(0, fw - r.w)),
    y: Math.min(Math.max(0, r.y), Math.max(0, fh - r.h)),
  });

  useEffect(() => {
    const onResize = () => layout();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // layout は毎描画で作り直されるが、依存に入れると無限ループになるため除外する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDrag = (clientX: number, clientY: number) => {
    if (!rect) return;
    const frame = frameRef.current;
    if (!frame) return;
    const box = frame.getBoundingClientRect();
    dragRef.current = {
      dx: clientX - box.left - rect.x,
      dy: clientY - box.top - rect.y,
    };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame || !rect) return;
    const box = frame.getBoundingClientRect();
    setRect(
      clamp(
        {
          ...rect,
          x: clientX - box.left - drag.dx,
          y: clientY - box.top - drag.dy,
        },
        frame.clientWidth,
        frame.clientHeight,
      ),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleSave = () => {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !frame || !rect) return;

    // 表示サイズと実寸の比率で、切り抜き範囲を元画像の座標に換算する
    const scaleX = img.naturalWidth / frame.clientWidth;
    const scaleY = img.naturalHeight / frame.clientHeight;

    const sx = Math.round(rect.x * scaleX);
    const sy = Math.round(rect.y * scaleY);
    const sw = Math.round(rect.w * scaleX);
    const sh = Math.round(rect.h * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="rounded-xl border border-neutral-300 bg-white p-4">
      <p className="text-charcoal-900 text-base font-bold">
        表示する範囲を選ぶ
      </p>
      <p className="text-foreground-muted mt-1 text-sm">
        枠をドラッグして位置を、下のつまみで大きさを調整します。
        一覧カードでは4:3に切り抜いて表示されます。
      </p>

      <div
        ref={frameRef}
        className="relative mt-3 w-full touch-none overflow-hidden bg-neutral-900 select-none"
        onPointerMove={(e) => moveDrag(e.clientX, e.clientY)}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/*
          ここは next/image ではなく素の <img> を使う。
          - canvasへ描くために原寸（naturalWidth/Height）が必要で、
            next/imageが返す最適化・リサイズ後の画像だと切り抜き座標の換算が狂う
          - crossOrigin="anonymous" が必要（無いとcanvasが汚染され toBlob が失敗する）。
            Supabaseの公開バケットはCORSを許可している
          管理画面の一時的な編集UIであり、公開ページのLCPには影響しない。
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          crossOrigin="anonymous"
          onLoad={() => layout()}
          className="block max-h-[60vh] w-full object-contain"
        />

        {rect && (
          <>
            {/* 枠の外を暗くして、どこが残るのかを分かりやすくする */}
            <div
              className="pointer-events-none absolute inset-0 bg-black/50"
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${rect.x}px ${rect.y}px, ${rect.x}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y + rect.h}px, ${rect.x + rect.w}px ${rect.y}px, ${rect.x}px ${rect.y}px)`,
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="切り抜く範囲。ドラッグで移動できます"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                startDrag(e.clientX, e.clientY);
              }}
              className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
              }}
            />
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <label className="block">
          <span className="text-charcoal-900 text-sm font-medium">比率</span>
          <select
            className="input mt-1"
            value={aspect}
            onChange={(e) => {
              const next = Number(e.target.value);
              setAspect(next);
              layout(size, next);
            }}
          >
            {ASPECT_PRESETS.map((p) => (
              <option key={p.label} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-charcoal-900 text-sm font-medium">
            大きさ（{size}%）
          </span>
          <input
            type="range"
            min={30}
            max={100}
            value={size}
            onChange={(e) => {
              const next = Number(e.target.value);
              setSize(next);
              layout(next, aspect);
            }}
            className="accent-primary-700 mt-2 h-11 w-full"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={saving || !rect}
          onClick={handleSave}
        >
          {saving ? "保存中..." : "この範囲で保存"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={saving}
          onClick={onCancel}
        >
          やめる
        </Button>
      </div>
    </div>
  );
}
