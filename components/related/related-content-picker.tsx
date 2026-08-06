"use client";

import { relatedContentTypeLabels } from "@/lib/related/schema";
import type {
  RelatedContentCandidate,
  RelatedContentTarget,
  RelatedContentType,
} from "@/lib/related/types";

// FR-TL-003 / FR-LIB-002 / FR-MNT-002: 管理画面での関連コンテンツ選択UI
export function RelatedContentPicker({
  candidates,
  selected,
  onChange,
}: {
  candidates: RelatedContentCandidate[];
  selected: RelatedContentTarget[];
  onChange: (next: RelatedContentTarget[]) => void;
}) {
  const selectedKeys = new Set(selected.map((s) => `${s.type}:${s.id}`));

  const toggle = (candidate: RelatedContentCandidate) => {
    const key = `${candidate.type}:${candidate.id}`;
    if (selectedKeys.has(key)) {
      onChange(selected.filter((s) => `${s.type}:${s.id}` !== key));
    } else {
      onChange([...selected, { type: candidate.type, id: candidate.id }]);
    }
  };

  const grouped = candidates.reduce<
    Partial<Record<RelatedContentType, RelatedContentCandidate[]>>
  >((acc, c) => {
    (acc[c.type] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <p className="text-sm font-medium text-neutral-600">
            {relatedContentTypeLabels[type]}
          </p>
          <div className="mt-1 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-neutral-200 p-2">
            {items.length === 0 && (
              <p className="text-sm text-neutral-400">候補がありません</p>
            )}
            {items.map((c) => (
              <label
                key={`${c.type}:${c.id}`}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedKeys.has(`${c.type}:${c.id}`)}
                  onChange={() => toggle(c)}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
