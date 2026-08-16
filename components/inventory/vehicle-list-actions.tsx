"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteJson } from "@/lib/api/client";

// 管理画面の車両一覧に置く操作ボタン群。
//
// 従来は「編集」しか無く、
// - 1台消すために、編集画面を開いて一番下までスクロールする
// - 似た個体を登録するのに、諸元を毎回ゼロから入力する
// という状態だった。どちらも在庫の入れ替えが起きるたびに発生する操作なので、
// 一覧から直接行えるようにする。
//
// 削除は論理削除（FR-INV-003）で、削除済み一覧から復元できる。
// ただし売約済みの車両はBR-DEL-003で削除できない。APIも409で拒否するが、
// 押してから断られるより、押せない理由が先に見えているほうが分かりやすいため、
// 一覧では最初からボタンを出さずに理由だけ添える。
export function VehicleListActions({
  vehicleId,
  vehicleName,
  isSold,
}: {
  vehicleId: string;
  vehicleName: string;
  isSold: boolean;
}) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    const result = await deleteJson(`/api/admin/vehicles/${vehicleId}`);

    if (!result.ok) {
      setError(
        result.status === 409
          ? result.message || "売約済みの車両は削除できません"
          : result.message,
      );
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          href={`/admin/vehicles/new?copy=${vehicleId}`}
          variant="ghost"
          size="sm"
        >
          コピーして登録
        </Button>
        <Button
          href={`/admin/vehicles/${vehicleId}/edit`}
          variant="outline"
          size="sm"
        >
          編集
        </Button>
        {isSold ? (
          <span className="text-foreground-muted text-sm">
            売約済みは削除できません
          </span>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => setPendingDelete(true)}
          >
            {isDeleting ? "削除中..." : "削除"}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={pendingDelete}
        title="車両を削除します"
        description={`「${vehicleName}」を削除します。公開ページから即座に非表示になります。削除済み一覧から復元できますが、復元しても公開状態には戻りません。`}
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDelete(false)}
        onConfirm={() => {
          setPendingDelete(false);
          void handleDelete();
        }}
      />
    </div>
  );
}
