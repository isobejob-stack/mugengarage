"use client";

import type { SeoFormFieldsValues } from "@/lib/seo/schema";

export type SeoFieldsErrors = {
  title?: string;
  description?: string;
  og_image_url?: string;
  canonical_url?: string;
};

// FR-SEO-001 / FR-INV-011 / FR-BLOG-005 / FR-ENC-004:
// 各管理フォーム共通のSEO設定セクション（SEOタイトル／説明文／OGP画像URL／canonical URL）。
// 日常的な編集では使わない項目のため折りたたみ可能にし、画面が煩雑にならないようにする（03_ui_rules.md 3章）。
export function SeoFieldsSection({
  value,
  onChange,
  errors,
}: {
  value: SeoFormFieldsValues;
  onChange: (next: SeoFormFieldsValues) => void;
  errors?: SeoFieldsErrors;
}) {
  const update = (patch: Partial<SeoFormFieldsValues>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <details className="group rounded-lg border border-neutral-200 bg-white p-4">
      <summary className="text-charcoal-900 flex min-h-11 cursor-pointer list-none items-center gap-2 font-serif text-xl font-bold tracking-tight marker:content-none sm:text-2xl [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="text-foreground-muted inline-block transition-transform group-open:rotate-90"
        >
          ▶
        </span>
        SEO設定（任意）
      </summary>
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-foreground-muted text-base">
          未入力の項目は、ページ本文の情報から自動生成された内容が使用されます。
        </p>
        <SeoField label="SEOタイトル" error={errors?.title}>
          <input
            type="text"
            className="input"
            value={value.title ?? ""}
            onChange={(e) => update({ title: e.target.value })}
          />
        </SeoField>
        <SeoField label="SEO説明文（description）" error={errors?.description}>
          <textarea
            rows={3}
            className="input"
            value={value.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
          />
        </SeoField>
        <SeoField label="OGP画像URL" error={errors?.og_image_url}>
          <input
            type="text"
            className="input"
            placeholder="https://..."
            value={value.og_image_url ?? ""}
            onChange={(e) => update({ og_image_url: e.target.value })}
          />
        </SeoField>
        <SeoField label="canonical URL" error={errors?.canonical_url}>
          <input
            type="text"
            className="input"
            placeholder="https://..."
            value={value.canonical_url ?? ""}
            onChange={(e) => update({ canonical_url: e.target.value })}
          />
        </SeoField>
      </div>
    </details>
  );
}

function SeoField({
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
