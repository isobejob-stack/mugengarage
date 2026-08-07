"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

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
      className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-medium backdrop:bg-black/40"
    >
      <h2 className="font-serif text-lg font-bold text-charcoal-900">{title}</h2>
      <p className="mt-2 text-base text-foreground-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={danger ? "destructive" : "primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
