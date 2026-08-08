"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { patchJson } from "@/lib/api/client";

// ISSUE-004課題1 / BR-DEL-002: 論理削除データの復元UI（6ドメイン共通）
// 各ドメインの「削除済み一覧」画面（例: app/admin/(protected)/vehicles/deleted/page.tsx）から使う
// 汎用リストコンポーネント。GET /api/admin/{domain}/deleted のレスポンス（各行は
// SoftDeletable由来の deleted_at を持つ）をそのまま items として受け取り、
// PATCH /api/admin/{domain}/{id}/restore を呼んで復元する。
// 開発部長レビュー指摘: 「復元は低リスクだから確認不要」としていたが、削除済み一覧から
// 本番データへ戻す操作である以上、03_ui_rules.mdの「取り消しにくい操作は確認ダイアログを
// 挟む」という原則に忠実にConfirmDialogを挟む（vehicles/articlesはstatus=publishedだった
// 場合の自動再公開を防ぐ対応も別途入れているが、UI側の確認も両輪で必要と判断）。
// 注: title/metaはrenderItem関数ではなくpropsとして渡す。Client Componentに
// 関数をpropsで渡すことはできない（Server Component側で事前に文字列へ変換して渡す）ため。
export function DeletedItemsList<
  T extends {
    id: string;
    deleted_at: string | null;
    title: string;
    meta?: string;
  },
>({
  domain,
  items,
  emptyMessage = "削除済みのデータはありません。",
}: {
  domain: string;
  items: T[];
  emptyMessage?: string;
}) {
  const [list, setList] = useState<T[]>(items);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRestore = async (id: string) => {
    setPendingId(id);
    setErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const result = await patchJson(`/api/admin/${domain}/${id}/restore`);

    if (!result.ok) {
      setErrors((prev) => ({
        ...prev,
        [id]: result.message,
      }));
      setPendingId(null);
      return;
    }

    setList((prev) => prev.filter((item) => item.id !== id));
    setPendingId(null);
  };

  if (list.length === 0) {
    return <p className="mt-8 text-base text-foreground-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {list.map((item) => {
        return (
          <li key={item.id}>
            <Card>
              <CardBody className="flex flex-row flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-lg font-semibold text-charcoal-900">
                    {item.title}
                  </p>
                  {item.meta && (
                    <p className="text-base text-foreground-muted">{item.meta}</p>
                  )}
                  <p className="text-sm text-foreground-muted">
                    削除日時:{" "}
                    {item.deleted_at
                      ? new Date(item.deleted_at).toLocaleString("ja-JP")
                      : "不明"}
                  </p>
                  {errors[item.id] && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors[item.id]}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={pendingId === item.id}
                  onClick={() => setConfirmTargetId(item.id)}
                >
                  {pendingId === item.id ? "復元中..." : "復元する"}
                </Button>
              </CardBody>
            </Card>
          </li>
        );
      })}

      <ConfirmDialog
        open={confirmTargetId !== null}
        title="データを復元します"
        description="このデータを元の一覧に戻します。公開ステータスを持つ種類のデータは、確認なしの誤公開を防ぐため非公開の状態で復元されます。"
        confirmLabel="復元する"
        onCancel={() => setConfirmTargetId(null)}
        onConfirm={() => {
          const id = confirmTargetId;
          setConfirmTargetId(null);
          if (id) void handleRestore(id);
        }}
      />
    </ul>
  );
}
