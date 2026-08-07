import { notFound } from "next/navigation";
import { getAdminTimelineEventById } from "@/lib/timeline/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { TimelineEventForm } from "@/components/timeline/timeline-event-form";
import type { TimelineEventFormValues } from "@/lib/timeline/schema";
import { getSeoMeta } from "@/lib/seo/queries";

// SCR-ADM-014: 年表イベント編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, candidates, related, seoMeta] = await Promise.all([
    getAdminTimelineEventById(id),
    listRelatedContentCandidates(["article", "encyclopedia_entry"]),
    listRelatedContents("timeline_event", id),
    // FR-SEO-001: SEO編集フォームの初期値として、SEOメタ情報も併せて取得する
    getSeoMeta("timeline_event", id),
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
        年表イベント編集
      </h1>
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
