import { notFound } from "next/navigation";
import { getAdminLibraryEntryById } from "@/lib/library/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { LibraryEntryForm } from "@/components/library/library-entry-form";
import type { LibraryEntryFormValues } from "@/lib/library/schema";
import { getSeoMeta } from "@/lib/seo/queries";

// SCR-ADM-016: ライブラリ項目編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, candidates, related, seoMeta] = await Promise.all([
    getAdminLibraryEntryById(id),
    listRelatedContentCandidates([
      "encyclopedia_entry",
      "article",
      "library_entry",
    ]),
    listRelatedContents("library_entry", id),
    // FR-SEO-001: SEO編集フォームの初期値として、SEOメタ情報も併せて取得する
    getSeoMeta("library_entry", id),
  ]);

  if (!entry) {
    notFound();
  }

  const defaultValues: LibraryEntryFormValues = {
    title: entry.title,
    slug: entry.slug,
    reading_kana: entry.reading_kana,
    category: entry.category,
    body: entry.body,
    related: related.map((r) => ({ type: r.type, id: r.id })),
    seo: {
      title: seoMeta?.title ?? null,
      description: seoMeta?.description ?? null,
      og_image_url: seoMeta?.og_image_url ?? null,
      canonical_url: seoMeta?.canonical_url ?? null,
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        ライブラリ項目編集
      </h1>
      <div className="mt-6">
        <LibraryEntryForm
          entryId={entry.id}
          defaultValues={defaultValues}
          candidates={candidates.filter((c) => c.id !== id)}
        />
      </div>
    </main>
  );
}
