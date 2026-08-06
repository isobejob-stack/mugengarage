"use client";

import { useState } from "react";
import { slugifyTagName } from "@/lib/tags/schema";
import type { Tag } from "@/lib/seo/types";

// FR-INV-012 / FR-BLOG-002: 車両・記事編集フォームでのタグ選択UI。
// 既存タグからの複数選択に加え、その場での新規タグ作成にも対応する
// （BR-DATA-003: タグはハードコードせず管理画面から追加できるマスタデータとして管理する）。
export function TagPicker({
  availableTags,
  selectedTagIds,
  onChange,
}: {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (next: string[]) => void;
}) {
  const [tags, setTags] = useState<Tag[]>(availableTags);
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSet = new Set(selectedTagIds);

  const toggle = (tagId: string) => {
    if (selectedSet.has(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setError(null);
    setCreating(true);

    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugifyTagName(name) }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error?.message ?? "タグの作成に失敗しました");
      setCreating(false);
      return;
    }

    const created: Tag = body.data;
    setTags((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja")),
    );
    onChange([...selectedTagIds, created.id]);
    setNewTagName("");
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-md border border-neutral-200 p-3">
        {tags.length === 0 && (
          <p className="text-sm text-neutral-400">
            タグはまだ登録されていません
          </p>
        )}
        {tags.map((tag) => (
          <label
            key={tag.id}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
              selectedSet.has(tag.id)
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-neutral-300 text-neutral-600"
            }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={selectedSet.has(tag.id)}
              onChange={() => toggle(tag.id)}
            />
            {tag.name}
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="新しいタグ名"
          className="input flex-1"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void createTag();
            }
          }}
        />
        <button
          type="button"
          disabled={creating || !newTagName.trim()}
          onClick={() => void createTag()}
          className="min-h-11 rounded-md border border-neutral-300 px-4 text-sm font-medium disabled:opacity-60"
        >
          {creating ? "作成中..." : "タグを追加"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
