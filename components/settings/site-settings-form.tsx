"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  siteSettingsFormSchema,
  type SiteSettingsFormValues,
} from "@/lib/settings/schema";
import { patchJson } from "@/lib/api/client";
import { Button, buttonClassName } from "@/components/ui/button";

// 店舗情報・外部リンクの編集フォーム。
// これらは従来 lib/site-config.ts にハードコードされており、変更のたびに開発とデプロイが
// 必要だった。とくにLINEのURLは全ページのCTAの遷移先であり、開発者を介さないと
// 最重要導線を直せない状態になっていた（docs/tasks/ISSUE-005）。
export function SiteSettingsForm({
  initialValues,
  initialHeroImageUrl,
}: {
  initialValues: SiteSettingsFormValues;
  initialHeroImageUrl: string | null;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SiteSettingsFormValues>({
    resolver: zodResolver(siteSettingsFormSchema),
    defaultValues: initialValues,
  });

  // 掲載媒体・SNSは今後増減しうるため、行を追加・削除できるようにする
  const { fields, append, remove } = useFieldArray({
    control,
    name: "external_links",
  });

  const onSubmit = async (values: SiteSettingsFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    setSaved(false);

    const result = await patchJson("/api/admin/site-settings", values);

    if (!result.ok) {
      setSubmitError(result.message);
      setSubmitting(false);
      return;
    }

    setSaved(true);
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 flex flex-col gap-10"
    >
      <section>
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          店舗情報
        </h2>
        <p className="text-foreground-muted mt-2 text-base">
          入力した内容は「店舗情報・アクセス」ページとフッターに反映されます。
          空欄の項目は公開サイトに表示されません。
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="郵便番号" error={errors.postal_code?.message}>
            <input
              type="text"
              className="input"
              placeholder="123-4567"
              {...register("postal_code")}
            />
          </Field>

          <Field label="電話番号" error={errors.phone?.message}>
            <input
              type="tel"
              className="input"
              placeholder="03-1234-5678"
              {...register("phone")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="住所" error={errors.address?.message}>
              <input
                type="text"
                className="input"
                placeholder="東京都〇〇区〇〇 1-2-3"
                {...register("address")}
              />
            </Field>
          </div>

          <Field label="営業時間" error={errors.business_hours?.message}>
            <input
              type="text"
              className="input"
              placeholder="10:00〜19:00"
              {...register("business_hours")}
            />
          </Field>

          <Field label="定休日" error={errors.closed_days?.message}>
            <input
              type="text"
              className="input"
              placeholder="水曜日・第2火曜日"
              {...register("closed_days")}
            />
          </Field>

          <Field label="創業年" error={errors.founded_year?.message}>
            <input
              type="number"
              className="input"
              placeholder="1995"
              {...register("founded_year")}
            />
          </Field>

          <Field label="代表者名" error={errors.representative_name?.message}>
            <input
              type="text"
              className="input"
              {...register("representative_name")}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="アクセス" error={errors.access_info?.message}>
              <textarea
                className="input min-h-24 py-2"
                placeholder="〇〇駅から徒歩5分。駐車場3台あり。"
                {...register("access_info")}
              />
            </Field>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          トップページの写真
        </h2>
        <p className="text-foreground-muted mt-2 text-base">
          店舗やガレージ、車両の写真を1枚設定すると、トップページの最上部に大きく表示されます。
          未設定の場合は文字だけの表示になります。
        </p>
        <HeroImageField
          initialUrl={initialHeroImageUrl}
          onError={setSubmitError}
        />
      </section>

      <section>
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          LINE相談のURL
        </h2>
        <p className="text-foreground-muted mt-2 text-base">
          公式LINEアカウントのURLです。サイト全体の「LINEで相談する」ボタンの遷移先になります。
          <strong className="text-charcoal-900">
            未設定のあいだはLINEボタンを表示しません。
          </strong>
        </p>
        <div className="mt-4">
          <Field label="LINEのURL" error={errors.line_url?.message}>
            <input
              type="url"
              className="input"
              placeholder="https://lin.ee/xxxxxxx"
              {...register("line_url")}
            />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
          掲載媒体・公式SNS
        </h2>
        <p className="text-foreground-muted mt-2 text-base">
          グーネット、車選びドットコム、Instagram、Facebookなどのリンクです。
          フッターと店舗情報ページに、ここで並べた順に表示されます。
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {fields.length === 0 && (
            <p className="text-foreground-muted text-base">
              まだリンクが登録されていません。
            </p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="shadow-soft rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="リンク名"
                  error={errors.external_links?.[index]?.label?.message}
                >
                  <input
                    type="text"
                    className="input"
                    placeholder="Instagram"
                    {...register(`external_links.${index}.label`)}
                  />
                </Field>
                <Field
                  label="説明（任意）"
                  error={errors.external_links?.[index]?.description?.message}
                >
                  <input
                    type="text"
                    className="input"
                    placeholder="入庫車両や作業の様子を発信"
                    {...register(`external_links.${index}.description`)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="URL"
                    error={errors.external_links?.[index]?.url?.message}
                  >
                    <input
                      type="url"
                      className="input"
                      placeholder="https://www.instagram.com/xxxx/"
                      {...register(`external_links.${index}.url`)}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  このリンクを削除
                </Button>
              </div>
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => append({ label: "", url: "", description: null })}
            >
              リンクを追加
            </Button>
          </div>
        </div>
      </section>

      {submitError && (
        <p className="text-base text-red-600" role="alert">
          {submitError}
        </p>
      )}
      {saved && (
        <p className="text-primary-700 text-base" role="status">
          保存しました。公開サイトに反映されています。
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
          {submitting ? "保存中..." : "保存する"}
        </Button>
        <Button href="/about" variant="outline" size="lg">
          公開ページを確認する
        </Button>
      </div>
    </form>
  );
}

// トップページのヒーロー画像。他の項目と違いファイルのアップロードを伴うため、
// 「保存する」ボタンとは独立して即時にアップロード・削除する
// （画像だけ選んで保存を押し忘れる、という取りこぼしを防ぐ）。
function HeroImageField({
  initialUrl,
  onError,
}: {
  initialUrl: string | null;
  onError: (message: string | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    onError(null);

    const formData = new FormData();
    formData.append("file", file);

    // FormDataのためJSON前提のAPIクライアントは使えない。
    // 通信断でも固まらないよう、ここでも必ずtry/catchで受け止める。
    try {
      const response = await fetch("/api/admin/site-settings/hero-image", {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        onError(body?.error?.message ?? "画像のアップロードに失敗しました");
        return;
      }

      setPreviewUrl(body.data.public_url);
    } catch {
      onError(
        "通信に失敗しました。電波状況をご確認のうえ、もう一度お試しください。",
      );
    } finally {
      setUploading(false);
      // 同じファイルを選び直したときにonChangeが発火しなくなるのを防ぐ
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setUploading(true);
    onError(null);

    try {
      const response = await fetch("/api/admin/site-settings/hero-image", {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        onError(body?.error?.message ?? "画像の削除に失敗しました");
        return;
      }
      setPreviewUrl(null);
    } catch {
      onError(
        "通信に失敗しました。電波状況をご確認のうえ、もう一度お試しください。",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6">
      {previewUrl && (
        <div className="shadow-soft relative mb-4 aspect-[16/9] w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-200">
          <Image
            src={previewUrl}
            alt="設定中のトップページ写真"
            fill
            sizes="(min-width: 640px) 36rem, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        id="hero-image-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <div className="flex flex-wrap gap-3">
        <label
          htmlFor="hero-image-input"
          className={buttonClassName({ variant: "outline", size: "md" })}
        >
          {uploading
            ? "処理中..."
            : previewUrl
              ? "写真を差し替える"
              : "写真を選ぶ"}
        </label>
        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="md"
            disabled={uploading}
            onClick={() => void remove()}
          >
            写真を外す
          </Button>
        )}
      </div>
    </div>
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </label>
  );
}
