"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const handleClick = async () => {
    setPending(true);
    await fetch(`/api/admin/reminders/${reminderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !isCompleted }),
    });
    router.refresh();
    setPending(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="min-h-11 rounded-md border border-neutral-300 px-3 py-1 text-sm disabled:opacity-60"
    >
      {isCompleted ? "未完了に戻す" : "完了にする"}
    </button>
  );
}
