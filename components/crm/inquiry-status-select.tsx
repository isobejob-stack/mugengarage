"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InquiryResponseStatus } from "@/lib/crm/types";

const options: { value: InquiryResponseStatus; label: string }[] = [
  { value: "unhandled", label: "未対応" },
  { value: "in_progress", label: "対応中" },
  { value: "completed", label: "完了" },
];

// FR-INQ-004: 対応ステータス管理
export function InquiryStatusSelect({
  inquiryId,
  initialStatus,
}: {
  inquiryId: string;
  initialStatus: InquiryResponseStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);

  const update = async (value: InquiryResponseStatus) => {
    setStatus(value);
    setSaving(true);
    await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response_status: value }),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <select
      className="input"
      value={status}
      disabled={saving}
      onChange={(e) => update(e.target.value as InquiryResponseStatus)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
