"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { slugifyTagName } from "@/lib/tags/schema";
import type { Tag } from "@/lib/seo/types";

// SCR-ADM-024 ・ FR-INV-012 / FR-BLOG-002 ・ BR-DATA-003:
// タグマスタの一覧表示・新規追加・削除を行う（管理画面から追加・編集可能なマスタデータとして管理する）
export function TagsManager({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortByName = (items: Tag[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name, "ja"));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSubmitError("タグ名を入力してください");
      return;
    }
    const trimmedSlug = (slug.trim() || slugifyTagName(trimmedName)).trim();
    if (!trimmedSlug) {
      setSubmitError("スラッグを入力してください");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedName, slug: trimmedSlug }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setSubmitError(body?.error?.message ?? "タグの作成に失敗しました");
      setSubmitting(false);
      return;
    }

    setTags((prev) => sortByName([...prev, body.data as Tag]));
    setName("");
    setSlug("");
    setSlugTouched(false);
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setDeleteError(body?.error?.message ?? "削除に失敗しました");
      return;
    }

    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="mt-6 flex flex-col gap-8">
      <Card>
        <CardBody>
          <form
            onSubmit={submit}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="block">
              <span className="text-base font-medium text-charcoal-900">タグ名</span>
              <input
                type="text"
                className="input mt-1"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  if (!slugTouched) setSlug(slugifyTagName(value));
                }}
              />
            </label>
            <label className="block">
              <span className="text-base font-medium text-charcoal-900">スラッグ</span>
              <input
                type="text"
                className="input mt-1"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </label>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "作成中..." : "タグを追加"}
            </Button>
          </form>
        </CardBody>
      </Card>

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}
      {deleteError && (
        <p className="text-base text-red-600" role="alert">
          {deleteError}
        </p>
      )}

      {tags.length === 0 ? (
        <p className="text-base text-foreground-muted">タグはまだ登録されていません。</p>
      ) : (
        <>
          <p className="text-sm text-foreground-muted sm:hidden">
            → 表は横にスクロールできます
          </p>
          <Card>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="border-b border-neutral-200 bg-cream-50 text-left text-foreground-muted">
                  <th className="px-4 py-3 font-medium">タグ名</th>
                  <th className="px-4 py-3 font-medium">スラッグ</th>
                  <th className="px-4 py-3 font-medium">作成日時</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-charcoal-900">{tag.name}</td>
                    <td className="px-4 py-3 font-mono text-charcoal-700">{tag.slug}</td>
                    <td className="px-4 py-3 text-foreground-muted">
                      {new Date(tag.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setPendingDeleteId(tag.id)}
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="タグを削除します"
        description="このタグを削除すると、紐付いている車両・記事からもタグが外れます。この操作は元に戻せません。"
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) void handleDelete(id);
        }}
      />
    </div>
  );
}
