"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
  type VehicleVideo,
} from "@/lib/inventory/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<
    string | null
  >(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoSubmitting, setVideoSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // 03_ui_rules.md 6章: アップロード時は進捗（プログレスバー）を表示する
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setPhotoError(null);

    // 03_non_functional_requirements.md 9章: アップロードファイルのサイズを制限する
    // （サーバー側でも app/api/admin/vehicles/[id]/photos/route.ts で同じ上限を再チェックする）
    const oversizedFile = Array.from(files).find(
      (file) => file.size > MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES,
    );
    if (oversizedFile) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPhotoError(
        `「${oversizedFile.name}」のサイズが上限（${
          MAX_VEHICLE_PHOTO_FILE_SIZE_BYTES / (1024 * 1024)
        }MB）を超えています。ファイルサイズを小さくしてから再度お試しください`,
      );
      return;
    }

    setUploadProgress(0);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/vehicles/${vehicleId}/photos`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

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

    const res = await fetch(`/api/admin/vehicles/${vehicleId}/photos/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds: nextPhotos.map((p) => p.id) }),
    });

    if (!res.ok) {
      setPhotos(previous);
      const body = await res.json().catch(() => null);
      setPhotoError(body?.error?.message ?? "並び替えに失敗しました");
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

  const submitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoError(null);
    setVideoSubmitting(true);

    const res = await fetch(`/api/admin/vehicles/${vehicleId}/videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_url: videoUrl }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setVideoError(body?.error?.message ?? "動画の登録に失敗しました");
    } else {
      setVideos((prev) => [...prev, body.data]);
      setVideoUrl("");
    }
    setVideoSubmitting(false);
  };

  const deleteVideo = async (videoId: string) => {
    setVideoError(null);
    const res = await fetch(
      `/api/admin/vehicles/${vehicleId}/videos/${videoId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setVideoError(body?.error?.message ?? "動画の削除に失敗しました");
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-base font-bold">写真</h3>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-neutral-300 px-4 text-base font-medium">
            写真を選択してアップロード
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedPhotoIds.size > 0 && (
            <button
              type="button"
              className="min-h-11 rounded-md border border-red-600 px-4 text-base font-medium text-red-600"
              onClick={() =>
                setPendingDeletePhotoIds(Array.from(selectedPhotoIds))
              }
            >
              選択した写真を削除（{selectedPhotoIds.size}件）
            </button>
          )}
        </div>

        {uploadProgress !== null && (
          <div className="mt-3 w-full max-w-sm">
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-1 text-base text-neutral-600">
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
          <p className="mt-2 text-base text-red-600">{photoError}</p>
        )}

        {photos.length === 0 ? (
          <p className="mt-4 text-base text-neutral-500">
            写真はまだ登録されていません
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className="relative rounded-md border border-neutral-200 p-2"
              >
                {index === 0 && (
                  <span className="absolute inset-x-0 top-0 z-10 rounded-t-md bg-black/70 px-2 py-1 text-center text-sm font-bold text-white">
                    ①メイン写真
                  </span>
                )}

                <label className="absolute top-3 left-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded bg-white shadow-md">
                  <input
                    type="checkbox"
                    checked={selectedPhotoIds.has(photo.id)}
                    onChange={() => togglePhotoSelection(photo.id)}
                    aria-label="この写真を選択"
                  />
                </label>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.public_url}
                  alt=""
                  className="aspect-square w-full rounded object-cover"
                />

                <div className="mt-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={index === 0 || reordering}
                        onClick={() => movePhoto(index, -1)}
                        aria-label="前に並び替え"
                        className="flex min-h-11 min-w-11 items-center justify-center rounded border border-neutral-300 disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={index === photos.length - 1 || reordering}
                        onClick={() => movePhoto(index, 1)}
                        aria-label="後に並び替え"
                        className="flex min-h-11 min-w-11 items-center justify-center rounded border border-neutral-300 disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDeletePhotoIds([photo.id])}
                      className="flex min-h-11 min-w-11 items-center justify-center rounded border border-red-600 text-base text-red-600"
                    >
                      削除
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0 || reordering}
                      onClick={() => movePhotoToStart(index)}
                      className="min-h-11 flex-1 rounded border border-neutral-300 text-base disabled:opacity-40"
                    >
                      先頭へ
                    </button>
                    <button
                      type="button"
                      disabled={index === photos.length - 1 || reordering}
                      onClick={() => movePhotoToEnd(index)}
                      className="min-h-11 flex-1 rounded border border-neutral-300 text-base disabled:opacity-40"
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
        <h3 className="text-base font-bold">動画（YouTube等の外部URL）</h3>

        <form onSubmit={submitVideo} className="mt-3 flex flex-wrap gap-3">
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            className="input min-h-11 flex-1"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <button
            type="submit"
            disabled={videoSubmitting}
            className="min-h-11 rounded-md bg-blue-600 px-4 text-base font-medium text-white disabled:opacity-60"
          >
            {videoSubmitting ? "登録中..." : "追加する"}
          </button>
        </form>

        {videoError && (
          <p className="mt-2 text-base text-red-600">{videoError}</p>
        )}

        {videos.length === 0 ? (
          <p className="mt-4 text-base text-neutral-500">
            動画はまだ登録されていません
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {videos.map((video) => (
              <li
                key={video.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 p-3"
              >
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-base text-blue-600 underline"
                >
                  {video.video_url}
                </a>
                <button
                  type="button"
                  onClick={() => setPendingDeleteVideoId(video.id)}
                  className="min-h-11 min-w-11 shrink-0 rounded border border-red-600 px-3 text-base text-red-600"
                >
                  削除
                </button>
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
