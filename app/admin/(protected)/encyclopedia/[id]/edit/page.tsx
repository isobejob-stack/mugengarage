import { notFound } from "next/navigation";
import {
  getAdminEncyclopediaEntryById,
  listAdminEncyclopediaEntries,
} from "@/lib/knowledge/queries";
import { EncyclopediaEntryForm } from "@/components/knowledge/encyclopedia-entry-form";
import type { EncyclopediaEntryFormValues } from "@/lib/knowledge/schema";

// SCR-ADM-012: 図鑑項目編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, candidateParents] = await Promise.all([
    getAdminEncyclopediaEntryById(id),
    listAdminEncyclopediaEntries(),
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
