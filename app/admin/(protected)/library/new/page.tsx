import { listRelatedContentCandidates } from "@/lib/related/queries";
import { LibraryEntryForm } from "@/components/library/library-entry-form";

// SCR-ADM-016: ライブラリ項目新規作成
export default async function Page() {
  const candidates = await listRelatedContentCandidates([
    "encyclopedia_entry",
    "article",
    "library_entry",
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        ライブラリ項目作成
      </h1>
      <div className="mt-6">
        <LibraryEntryForm candidates={candidates} />
      </div>
    </main>
  );
}
