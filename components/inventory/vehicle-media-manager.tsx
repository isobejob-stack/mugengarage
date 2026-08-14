"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
  type VehicleVideo,
} from "@/lib/inventory/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button, buttonClassName } from "@/components/ui/button";
import { deleteJson, patchJson, postJson } from "@/lib/api/client";
import { prepareVehiclePhotosForUpload } from "@/lib/inventory/image-resize";

export type PhotoWithUrl = {
  id: string;
  vehicle_id: string;
  storage_path: string;
  display_order: number;
  public_url: string;
};

// FR-INV-009 / FR-INV-010: 車両編集フォーム内の写真・動画管理UI（SCR-ADM-004）
// 既存車両（vehicleIdが確定している）でのみ利用可能。
export function VehicleMediaManager({
  vehicleId,
  initialPhotos,
  initialVideos,
}: {
  vehicleId: string;
  initialPhotos: PhotoWithUrl[];
  initialVideos: VehicleVideo[];
}) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>(initialPhotos);
  const [videos, setVideos] = useState<VehicleVideo[]>(initialVideos);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    new Set(),
  );
  const [pendingDeletePhotoIds, setPendingDeletePhotoIds] = useState<
    string[] | null
  >(null);
  const [pendingDeleteVideoId, setPendingDeleteVideoId] = useState<
    string | null
  >(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  // 縮小処理中。枚数が多いと数秒かかるため、無反応に見えないよう表示に出す
  const [preparingPhotos, setPreparingPhotos] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<
    string | null
  >(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const successMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // UIUXデザイナーレビュー指摘: アップロード完了後のフィードバックを一定時間だけ表示する
  useEffect(() => {
    return () => {
      if (successMessageTimeoutRef.current) {
        clearTimeout(successMessageTimeoutRef.current);
      }
    };
  }, []);

  // カメラ用・アルバム用の2つのinputを持つため、どちらから選ばれた場合も両方クリアする
  // （同じ写真を連続で選び直したときにonChangeが発火しなくなるのを防ぐ）
  const resetFileInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // 03_ui_rules.md 6章: アップロード時は進捗（プログレスバー）を表示する
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    setPhotoError(null);

    // 送信前にブラウザ内で長辺2400pxまで縮小する。
    // 以前はここで20MB超を「小さくしてから再度お試しください」と拒否していたが、
    // 現地でiPhoneから登録する運用では写真を縮小する手段が無く、行き止まりだった。
    // 縮小により、上限に当たること自体がほぼ無くなり、電波の弱い場所での
    // 送信時間・失敗率も下がる（lib/inventory/image-resize.ts）。
    setPreparingPhotos(true);
    let files: File[];
    try {
      files = await prepareVehiclePhotosForUpload(Array.from(selected));
    } finally {
      setPreparingPhotos(false);
    }

    // 縮小しても上限を超える場合のみ弾く（HEIC等、ブラウザが展開できない形式が該当しうる）。
    // サーバー側でも app/api/admin/vehicles/[id]/photos/route.ts で同じ上限を再チェックする
    // （03_non_functional_requirements.md 9章）。
    const oversizedFile = files.find(
      (file) => file.size > MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
    );
    if (oversizedFile) {
      resetFileInputs();
      setPhotoError(
        `「${oversizedFile.name}」は縮小してもサイズ上限（${
          MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES / (1024 * 1024)
        }MB）を超えています。別の形式（JPEG）で保存し直してからお試しください`,
      );
      return;
    }

    setUploadProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/vehicles/${vehicleId}/photos`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploadProgress(null);
      resetFileInputs();

      let body: { data?: PhotoWithUrl[]; error?: { message: string } } | null =
        null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.data) {
        const uploadedPhotos = body.data;
        setPhotos((prev) => [...prev, ...uploadedPhotos]);

        setUploadSuccessMessage(
          `${uploadedPhotos.length}枚の写真をアップロードしました`,
        );
        if (successMessageTimeoutRef.current) {
          clearTimeout(successMessageTimeoutRef.current);
        }
        successMessageTimeoutRef.current = setTimeout(() => {
          setUploadSuccessMessage(null);
        }, 2500);
      } else {
        setPhotoError(
          body?.error?.message ?? "写真のアップロードに失敗しました",
        );
      }
    };
    xhr.onerror = () => {
      setUploadProgress(null);
      setPhotoError("写真のアップロードに失敗しました");
    };
    xhr.send(formData);
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const runReorder = async (nextPhotos: PhotoWithUrl[]) => {
    setReordering(true);
    setPhotoError(null);
    const previous = photos;
    setPhotos(nextPhotos);

    const result = await patchJson(
      `/api/admin/vehicles/${vehicleId}/photos/reorder`,
      { photoIds: nextPhotos.map((p) => p.id) },
    );

    // 楽観的に並び替えた表示を、失敗時は元の順序へ戻す
    if (!result.ok) {
      setPhotos(previous);
      setPhotoError(result.message);
    }
    setReordering(false);
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    void runReorder(next);
  };

  // UIUXデザイナーレビュー指摘: ↑↓（微調整用）に加えて先頭・末尾への一括移動を用意する
  // TODO: 将来的にドラッグ&ドロップでの並び替えに対応する（03_ui_rules.md 6章、今回はMVPスコープ外）
  const movePhotoToStart = (index: number) => {
    if (index <= 0) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    void runReorder(next);
  };

  const movePhotoToEnd = (index: number) => {
    if (index >= photos.length - 1) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.push(moved);
    void runReorder(next);
  };

  const deletePhotos = async (photoIds: string[]) => {
    setPhotoError(null);
    const results = await Promise.all(
      photoIds.map(async (photoId) => {
        try {
          const res = await fetch(
            `/api/admin/vehicles/${vehicleId}/photos/${photoId}`,
            { method: "DELETE" },
          );
          return { photoId, ok: res.ok };
        } catch {
          // ネットワークエラー等でfetch自体が失敗した場合も「削除できなかった」として扱う
          return { photoId, ok: false };
        }
      }),
    );

    // UIとDBの状態を乖離させないよう、DELETEに成功したphotoIdのみをローカルstateから除去する。
    // 失敗したものは一覧に残し、非エンジニア運用者が「どれが削除できなかったか」を見て再操作できるようにする。
    const succeededIds = new Set(
      results.filter((r) => r.ok).map((r) => r.photoId),
    );
    const failedIds = results.filter((r) => !r.ok).map((r) => r.photoId);

    if (failedIds.length > 0) {
      setPhotoError(
        results.length > 1
          ? `${failedIds.length}件の写真の削除に失敗しました。再度お試しください`
          : "写真の削除に失敗しました。再度お試しください",
      );
    }

    setPhotos((prev) => prev.filter((p) => !succeededIds.has(p.id)));
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const submitVideo = async () => {
    setVideoError(null);

    // ブラウザの required を外した分の入力チェックをここで行う。
    // 空のまま「追加する」を押したときに、無駄な通信をせずその場で伝える
    // （URLの形式そのものはサーバーの vehicleVideoFormSchema でも検証される）。
    if (videoUrl.trim() === "") {
      setVideoError("動画URLを入力してください");
      return;
    }

    setVideoSubmitting(true);

    const result = await postJson<VehicleVideo>(
      `/api/admin/vehicles/${vehicleId}/videos`,
      { video_url: videoUrl },
    );

    if (!result.ok) {
      setVideoError(result.message);
    } else {
      setVideos((prev) => [...prev, result.data]);
      setVideoUrl("");
    }
    setVideoSubmitting(false);
  };

  const deleteVideo = async (videoId: string) => {
    setVideoError(null);
    const result = await deleteJson(
      `/api/admin/vehicles/${vehicleId}/videos/${videoId}`,
    );
    if (!result.ok) {
      setVideoError(result.message);
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          写真
        </h3>

        {/* 現地での撮影導線は「カメラ」と「アルバム」で入口を分ける。
            capture属性はスマートフォンでカメラを直接起動できる一方、指定すると
            アルバムからの選択と複数枚同時選択ができなくなる（iOS Safari等）。
            「たくさん撮ってまとめて登録したい」運用を殺さないよう、
            1枚ずつその場で撮る用（capture付き）と、撮り溜めた写真をまとめて選ぶ用
            （capture無し・multiple）の2つのボタンを併置する。 */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label
            className={buttonClassName({
              variant: "primary",
              size: "md",
              className: "cursor-pointer sm:hidden",
            })}
          >
            カメラで撮影
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
          </label>

          <label
            className={buttonClassName({
              variant: "outline",
              size: "md",
              className: "cursor-pointer",
            })}
          >
            <span className="sm:hidden">アルバムから選ぶ（複数可）</span>
            <span className="hidden sm:inline">写真を選択してアップロード</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
          </label>

          {selectedPhotoIds.size > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="md"
              onClick={() =>
                setPendingDeletePhotoIds(Array.from(selectedPhotoIds))
              }
            >
              選択した写真を削除（{selectedPhotoIds.size}件）
            </Button>
          )}
        </div>

        {preparingPhotos && (
          <p className="text-foreground-muted mt-3 text-base">
            写真を送信用に縮小しています...
          </p>
        )}

        {uploadProgress !== null && (
          <div className="mt-3 w-full max-w-sm">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="bg-primary-600 ease-standard h-2 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-foreground-muted mt-1 text-base">
              アップロード中... {uploadProgress}%
            </p>
          </div>
        )}

        {uploadSuccessMessage && (
          <p className="mt-2 text-base font-medium text-green-700">
            {uploadSuccessMessage}
          </p>
        )}

        {photoError && (
          <p className="mt-2 text-base text-red-600" role="alert">
            {photoError}
          </p>
        )}

        {photos.length === 0 ? (
          <p className="text-foreground-muted mt-4 text-base">
            写真はまだ登録されていません
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className="relative rounded-lg border border-neutral-200 p-2"
              >
                {index === 0 && (
                  <span className="absolute inset-x-0 top-0 z-10 rounded-t-md bg-black/70 px-2 py-1 text-center text-sm font-bold text-white">
                    ①メイン写真
                  </span>
                )}

                <label className="shadow-medium absolute top-3 left-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded bg-white">
                  <input
                    type="checkbox"
                    className="accent-primary-600 h-5 w-5"
                    checked={selectedPhotoIds.has(photo.id)}
                    onChange={() => togglePhotoSelection(photo.id)}
                    aria-label="この写真を選択"
                  />
                </label>

                {/* 現地でスマートフォンから写真を登録する運用のため、ここは特に効く。
                    生の<img>では登録済み写真の枚数ぶんフルサイズ（1枚あたり数MB）が
                    ダウンロードされ、電波の弱い屋外で待たされる原因になっていた。 */}
                <div className="relative aspect-square w-full overflow-hidden rounded">
                  <Image
                    src={photo.public_url}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover"
                  />
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || reordering}
                        onClick={() => movePhoto(index, -1)}
                        aria-label="前に並び替え"
                        className="text-charcoal-900 ease-standard hover:border-primary-400 hover:bg-primary-50 flex min-h-11 min-w-11 items-center justify-center rounded border border-neutral-300 transition-colors duration-200 disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === photos.length - 1 || reordering}
                        onClick={() => movePhoto(index, 1)}
                        aria-label="後に並び替え"
                        className="text-charcoal-900 ease-standard hover:border-primary-400 hover:bg-primary-50 flex min-h-11 min-w-11 items-center justify-center rounded border border-neutral-300 transition-colors duration-200 disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setPendingDeletePhotoIds([photo.id])}
                    >
                      削除
                    </Button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || reordering}
                      onClick={() => movePhotoToStart(index)}
                      // 「先頭へ」では何が起きるか分からない。この操作の実際の意味は
                      // 「一覧・トップに出るサムネイルをこの写真にする」なので、そう書く。
                      className="text-charcoal-900 ease-standard hover:border-primary-400 hover:bg-primary-50 min-h-11 flex-1 rounded border border-neutral-300 text-base transition-colors duration-200 disabled:opacity-40"
                    >
                      メインにする
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1 || reordering}
                      onClick={() => movePhotoToEnd(index)}
                      className="text-charcoal-900 ease-standard hover:border-primary-400 hover:bg-primary-50 min-h-11 flex-1 rounded border border-neutral-300 text-base transition-colors duration-200 disabled:opacity-40"
                    >
                      末尾へ
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          動画（YouTube等の外部URL）
        </h3>

        {/* 車両編集フォーム（<form>）の内側にネストされるため、HTML仕様上ここは
            <form>にできない（<form>のネストは無効でハイドレーションエラーの原因になる）。
            送信ボタンのclickとEnterキー押下の両方でsubmitVideoを呼ぶ。 */}
        <div className="mt-3 flex flex-wrap gap-3">
          {/*
            type="url" と required を付けてはいけない。
            この入力欄は車両編集フォーム（<form>）の内側にあるため、
            ブラウザの標準バリデーションは「親フォームの送信時」にここも検査する。
            required が付いていると、動画を登録しないかぎり
            **車両情報そのものが保存できない**という状態になっていた。
            同じ理由で type="url" も使えない（書きかけのURLが残っていると
            車両の保存がブロックされる）。

            URLの検証はこの欄の「追加する」を押したときだけ行えばよいので、
            submitVideo 側（およびサーバーの vehicleVideoFormSchema）に任せる。
            inputMode="url" はキーボードの出し分けのためだけのもので、
            バリデーションには影響しない。
          */}
          <input
            type="text"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=..."
            className="input flex-1"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submitVideo();
              }
            }}
          />
          <Button
            type="button"
            disabled={videoSubmitting}
            variant="primary"
            onClick={() => void submitVideo()}
          >
            {videoSubmitting ? "登録中..." : "追加する"}
          </Button>
        </div>

        {videoError && (
          <p className="mt-2 text-base text-red-600" role="alert">
            {videoError}
          </p>
        )}

        {videos.length === 0 ? (
          <p className="text-foreground-muted mt-4 text-base">
            動画はまだ登録されていません
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {videos.map((video) => (
              <li
                key={video.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
              >
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-700 truncate text-base underline"
                >
                  {video.video_url}
                </a>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setPendingDeleteVideoId(video.id)}
                >
                  削除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDeletePhotoIds !== null}
        title="写真を削除します"
        description={`削除すると公開ページから即座に非表示になります。${
          pendingDeletePhotoIds && pendingDeletePhotoIds.length > 1
            ? `${pendingDeletePhotoIds.length}件の写真を削除します。`
            : ""
        }よろしいですか？`}
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDeletePhotoIds(null)}
        onConfirm={() => {
          if (pendingDeletePhotoIds) void deletePhotos(pendingDeletePhotoIds);
          setPendingDeletePhotoIds(null);
        }}
      />

      <ConfirmDialog
        open={pendingDeleteVideoId !== null}
        title="動画を削除します"
        description="削除すると公開ページから即座に非表示になります。よろしいですか？"
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDeleteVideoId(null)}
        onConfirm={() => {
          if (pendingDeleteVideoId) void deleteVideo(pendingDeleteVideoId);
          setPendingDeleteVideoId(null);
        }}
      />
    </div>
  );
}
