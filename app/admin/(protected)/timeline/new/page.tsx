import { listRelatedContentCandidates } from "@/lib/related/queries";
import { TimelineEventForm } from "@/components/timeline/timeline-event-form";

// SCR-ADM-014: 年表イベント新規作成
export default async function Page() {
  const candidates = await listRelatedContentCandidates([
    "article",
    "encyclopedia_entry",
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        年表イベント作成
      </h1>
      <div className="mt-6">
        <TimelineEventForm candidates={candidates} />
      </div>
    </main>
  );
}
