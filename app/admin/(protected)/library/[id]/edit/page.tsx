import { notFound } from "next/navigation";
import { getAdminLibraryEntryById } from "@/lib/library/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { LibraryEntryForm } from "@/components/library/library-entry-form";
import type { LibraryEntryFormValues } from "@/lib/library/schema";

// SCR-ADM-016: ライブラリ項目編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, candidates, related] = await Promise.all([
    getAdminLibraryEntryById(id),
    listRelatedContentCandidates([
      "encyclopedia_entry",
      "article",
      "library_entry",
    ]),
    listRelatedContents("library_entry", id),
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
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">ライブラリ項目編集</h1>
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
