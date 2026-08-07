"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      type="button"
      onClick={handleClick}
      disabled={pending}
      variant="outline"
      size="sm"
    >
      {isCompleted ? "未完了に戻す" : "完了にする"}
    </Button>
  );
}
