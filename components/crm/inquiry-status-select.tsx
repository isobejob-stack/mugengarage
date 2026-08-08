"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InquiryResponseStatus } from "@/lib/crm/types";
import { patchJson } from "@/lib/api/client";

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
  const [error, setError] = useState<string | null>(null);

  const update = async (value: InquiryResponseStatus) => {
    const previous = status;
    setStatus(value);
    setSaving(true);
    setError(null);

    const result = await patchJson(`/api/admin/inquiries/${inquiryId}`, {
      response_status: value,
    });

    setSaving(false);

    // 従来は応答を一切見ておらず、保存に失敗しても画面上は新しいステータスに
    // 変わったままだった（対応済みにしたつもりが記録されていない状態になりうる）。
    // 失敗時は表示を元に戻し、理由を伝える。
    if (!result.ok) {
      setStatus(previous);
      setError(result.message);
      return;
    }

    router.refresh();
  };

  return (
    <div>
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
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
