import { notFound } from "next/navigation";
import {
  getAdminEncyclopediaEntryById,
  listAdminEncyclopediaEntries,
} from "@/lib/knowledge/queries";
import { EncyclopediaEntryForm } from "@/components/knowledge/encyclopedia-entry-form";
import type { EncyclopediaEntryFormValues } from "@/lib/knowledge/schema";
import { getSeoMeta } from "@/lib/seo/queries";

// SCR-ADM-012: 図鑑項目編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, candidateParents, seoMeta] = await Promise.all([
    getAdminEncyclopediaEntryById(id),
    listAdminEncyclopediaEntries(),
    // FR-ENC-004: SEO編集フォームの初期値として、SEOメタ情報も併せて取得する
    getSeoMeta("encyclopedia_entry", id),
  ]);

  if (!entry) {
    notFound();
  }

  const defaultValues: EncyclopediaEntryFormValues = {
    category: entry.category,
    parent_id: entry.parent_id,
    title: entry.title,
    slug: entry.slug,
    body: entry.body,
    seo: {
      title: seoMeta?.title ?? null,
      description: seoMeta?.description ?? null,
      og_image_url: seoMeta?.og_image_url ?? null,
      canonical_url: seoMeta?.canonical_url ?? null,
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">図鑑項目編集</h1>
      <div className="mt-6">
        <EncyclopediaEntryForm
          entryId={entry.id}
          defaultValues={defaultValues}
          candidateParents={candidateParents}
        />
      </div>
    </main>
  );
}
