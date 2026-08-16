"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  articleFormSchema,
  emptyArticleFormValues,
  slugify,
  type ArticleFormValues,
} from "@/lib/content/schema";
import { contentCategoryOptions } from "@/lib/content/categories";
import { emptySeoFieldsValues } from "@/lib/seo/schema";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SeoFieldsSection } from "@/components/ui/seo-fields-section";
import { TagPicker } from "@/components/tags/tag-picker";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/lib/seo/types";
import { deleteJson, sendJson } from "@/lib/api/client";
import {
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
} from "@/lib/utils/datetime-local";

// SCR-ADM-010: ブログ記事編集フォーム
export function ArticleForm({
  articleId,
  defaultValues,
  allTags,
}: {
  articleId?: string;
  defaultValues?: ArticleFormValues;
  allTags?: Tag[];
}) {
  const tagOptions = allTags ?? [];
  const router = useRouter();
  const isEdit = Boolean(articleId);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: defaultValues ?? emptyArticleFormValues,
  });

  const onSubmit = async (values: ArticleFormValues) => {
    setSubmitError(null);
    const result = await sendJson(
      isEdit ? `/api/admin/articles/${articleId}` : "/api/admin/articles",
      isEdit ? "PATCH" : "POST",
      values,
    );

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }

    router.push("/admin/articles");
    router.refresh();
  };

  // FR-BLOG-001: 記事の論理削除
  const handleDelete = async () => {
    if (!articleId) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteJson(`/api/admin/articles/${articleId}`);

    if (!result.ok) {
      setDeleteError(result.message);
      setIsDeleting(false);
      return;
    }

    router.push("/admin/articles");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 pb-24"
    >
      <Field label="タイトル" error={errors.title?.message}>
        <input
          type="text"
          className="input"
          {...register("title")}
          onChange={(e) => {
            setValue("title", e.target.value);
            if (!slugTouched) {
              setValue("slug", slugify(e.target.value));
            }
          }}
        />
      </Field>

      <Field label="スラッグ（URL）" error={errors.slug?.message}>
        <input
          type="text"
          className="input"
          {...register("slug")}
          onChange={(e) => {
            setSlugTouched(true);
            setValue("slug", e.target.value);
          }}
        />
        {isEdit && (
          <p className="text-foreground-muted mt-1 text-base">
            URLが変更されます。変更前のURLは自動的に新しいURLへリダイレクトされます。
          </p>
        )}
      </Field>

      {/* カテゴリは自由入力からプルダウンへ変更した（発注者要望 2026-08-17）。
          自由入力だと「維持・メンテナンス」「メンテナンス」のような表記ゆれが生まれ、
          公開側のカテゴリ絞り込みが同じ内容で2つに割れてしまうため。
          5分類に無い既存の値は contentCategoryOptions が先頭に残すので、
          旧カテゴリの記事を保存してもカテゴリが勝手に書き換わらない。 */}
      <Field label="カテゴリ（任意）">
        <select
          className="input"
          {...register("category", {
            // 空欄は「未設定」。DBに空文字を入れると公開側で中身の無いchipが増えるためnullに寄せる
            setValueAs: (v) => (v === "" ? null : (v as string)),
          })}
          value={watch("category") ?? ""}
        >
          <option value="">未設定</option>
          {contentCategoryOptions(watch("category")).map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="本文（Markdown）" error={errors.body?.message}>
        <textarea rows={14} className="input" {...register("body")} />
      </Field>

      {/* FR-BLOG-002: 記事にタグを設定できる（BR-DATA-003: マスタデータとして管理） */}
      <Field label="タグ（任意）">
        <TagPicker
          availableTags={tagOptions}
          selectedTagIds={watch("tags")}
          onChange={(next) => setValue("tags", next)}
        />
      </Field>

      <Field label="公開ステータス">
        <select className="input" {...register("status")}>
          <option value="draft">下書き</option>
          <option value="published">公開</option>
        </select>
      </Field>

      {/* FR-BLOG-004: 公開予約。下書き状態の記事にのみ意味を持つ項目のため、その旨をヘルプテキストで明示する */}
      {/* レビュー指摘対応（必須修正1・2）: datetime-localはタイムゾーン情報を持たないローカル時刻
          文字列を扱うため、表示時はUTC ISO→ローカル時刻、送信時はローカル時刻→UTC ISO（空文字はnull）
          に変換する（lib/utils/datetime-local.ts）。 */}
      <Field label="公開予約日時（任意）">
        <input
          type="datetime-local"
          className="input"
          {...register("scheduled_publish_at", {
            setValueAs: (v) => fromDatetimeLocalValue(v as string),
          })}
          value={toDatetimeLocalValue(watch("scheduled_publish_at"))}
        />
        <p className="text-foreground-muted mt-1 text-base">
          指定日時になると自動的に公開ステータスに変わります（公開ステータスが「下書き」の場合のみ有効です）。
        </p>
      </Field>

      {isEdit && (
        <SeoFieldsSection
          value={watch("seo") ?? emptySeoFieldsValues}
          onChange={(next) => setValue("seo", next)}
          errors={{
            title: errors.seo?.title?.message,
            description: errors.seo?.description?.message,
            og_image_url: errors.seo?.og_image_url?.message,
            canonical_url: errors.seo?.canonical_url?.message,
          }}
        />
      )}

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}

      {isEdit && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="font-serif text-lg font-bold text-red-700">
            危険な操作
          </h2>
          <p className="text-foreground-muted mt-1 text-base">
            この記事を削除すると公開ページから即座に非表示になります。この操作は元に戻せません。
          </p>
          {deleteError && (
            <p className="mt-2 text-base text-red-600" role="alert">
              {deleteError}
            </p>
          )}
          <Button
            type="button"
            disabled={isDeleting}
            onClick={() => setPendingDelete(true)}
            variant="destructive"
            size="md"
            className="mt-3"
          >
            {isDeleting ? "削除中..." : "この記事を削除する"}
          </Button>
        </section>
      )}

      <div className="shadow-medium fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white p-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="mx-auto w-full max-w-md justify-center"
        >
          {isSubmitting ? "保存中..." : isEdit ? "更新する" : "保存する"}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete}
        title="記事を削除します"
        description="この記事を削除します。公開ページから即座に非表示になります。この操作は元に戻せません。"
        confirmLabel="削除する"
        danger
        onCancel={() => setPendingDelete(false)}
        onConfirm={() => {
          setPendingDelete(false);
          void handleDelete();
        }}
      />
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-charcoal-900 text-base font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {error && (
        <p className="mt-1 text-base text-red-600" role="alert">
          {error}
        </p>
      )}
    </label>
  );
}
