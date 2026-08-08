"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { patchJson } from "@/lib/api/client";

// FR-CRM-004: リマインダーの完了・未完了切り替え
export function ReminderToggle({
  reminderId,
  isCompleted,
}: {
  reminderId: string;
  isCompleted: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setPending(true);
    setError(null);

    const result = await patchJson(`/api/admin/reminders/${reminderId}`, {
      is_completed: !isCompleted,
    });

    setPending(false);

    // 従来は応答を見ておらず、失敗しても成功したかのように画面を更新していた。
    // リマインダーは「対応期日を忘れない」ための機能なので、
    // 完了にしたつもりが記録されていない状態は実害が大きい。
    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <Button
        type="button"
        onClick={handleClick}
        disabled={pending}
        variant="outline"
        size="sm"
      >
        {isCompleted ? "未完了に戻す" : "完了にする"}
      </Button>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
