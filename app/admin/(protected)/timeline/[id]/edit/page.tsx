import { notFound } from "next/navigation";
import { getAdminTimelineEventById } from "@/lib/timeline/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { TimelineEventForm } from "@/components/timeline/timeline-event-form";
import type { TimelineEventFormValues } from "@/lib/timeline/schema";

// SCR-ADM-014: 年表イベント編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, candidates, related] = await Promise.all([
    getAdminTimelineEventById(id),
    listRelatedContentCandidates(["article", "encyclopedia_entry"]),
    listRelatedContents("timeline_event", id),
  ]);

  if (!event) {
    notFound();
  }

  const defaultValues: TimelineEventFormValues = {
    event_date: event.event_date,
    date_precision: event.date_precision,
    category: event.category,
    title: event.title,
    body: event.body,
    related: related.map((r) => ({ type: r.type, id: r.id })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">年表イベント編集</h1>
      <div className="mt-6">
        <TimelineEventForm
          eventId={event.id}
          defaultValues={defaultValues}
          candidates={candidates}
        />
      </div>
    </main>
  );
}
