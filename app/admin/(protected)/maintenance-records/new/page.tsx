import { listRelatedContentCandidates } from "@/lib/related/queries";
import { MaintenanceRecordForm } from "@/components/maintenance/maintenance-record-form";

// SCR-ADM-018: 整備実績新規作成
export default async function Page() {
  const candidates = await listRelatedContentCandidates([
    "vehicle",
    "encyclopedia_entry",
    "article",
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        整備実績作成
      </h1>
      <div className="mt-6">
        <MaintenanceRecordForm candidates={candidates} />
      </div>
    </main>
  );
}
