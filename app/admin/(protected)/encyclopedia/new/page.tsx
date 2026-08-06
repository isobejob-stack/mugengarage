import { listAdminEncyclopediaEntries } from "@/lib/knowledge/queries";
import { EncyclopediaEntryForm } from "@/components/knowledge/encyclopedia-entry-form";

// SCR-ADM-012: 図鑑項目新規作成
export default async function Page() {
  const candidateParents = await listAdminEncyclopediaEntries();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">図鑑項目作成</h1>
      <div className="mt-6">
        <EncyclopediaEntryForm candidateParents={candidateParents} />
      </div>
    </main>
  );
}
