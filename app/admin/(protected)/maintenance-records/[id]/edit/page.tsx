import { notFound } from "next/navigation";
import { getAdminMaintenanceRecordById } from "@/lib/maintenance/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { MaintenanceRecordForm } from "@/components/maintenance/maintenance-record-form";
import type { MaintenanceRecordFormValues } from "@/lib/maintenance/schema";
import { getSeoMeta } from "@/lib/seo/queries";

// SCR-ADM-018: 整備実績編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [record, candidates, related, seoMeta] = await Promise.all([
    getAdminMaintenanceRecordById(id),
    listRelatedContentCandidates(["vehicle", "encyclopedia_entry", "article"]),
    listRelatedContents("maintenance_record", id),
    // FR-SEO-001: SEO編集フォームの初期値として、SEOメタ情報も併せて取得する
    getSeoMeta("maintenance_record", id),
  ]);

  if (!record) {
    notFound();
  }

  const defaultValues: MaintenanceRecordFormValues = {
    title: record.title,
    slug: record.slug,
    category: record.category,
    issue_description: record.issue_description,
    cost: record.cost,
    body: record.body,
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
        整備実績編集
      </h1>
      <div className="mt-6">
        <MaintenanceRecordForm
          recordId={record.id}
          defaultValues={defaultValues}
          candidates={candidates}
        />
      </div>
    </main>
  );
}
