"use client";

import { useEffect, useRef } from "react";

// 削除・ステータス変更等の取り消しにくい操作の前に必ず挟む確認ダイアログ
// （03_ui_rules.md 7章・8章）。影響範囲を文言で明示すること。
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "実行する",
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="w-full max-w-sm rounded-lg p-6 backdrop:bg-black/40"
    >
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 min-w-11 rounded-md px-4 py-2 text-neutral-700"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`min-h-11 min-w-11 rounded-md px-4 py-2 font-medium text-white ${
            danger ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
