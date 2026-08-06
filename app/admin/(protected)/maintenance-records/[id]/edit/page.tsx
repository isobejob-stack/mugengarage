import { notFound } from "next/navigation";
import { getAdminMaintenanceRecordById } from "@/lib/maintenance/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { MaintenanceRecordForm } from "@/components/maintenance/maintenance-record-form";
import type { MaintenanceRecordFormValues } from "@/lib/maintenance/schema";

// SCR-ADM-018: 整備実績編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [record, candidates, related] = await Promise.all([
    getAdminMaintenanceRecordById(id),
    listRelatedContentCandidates(["vehicle", "encyclopedia_entry", "article"]),
    listRelatedContents("maintenance_record", id),
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
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">整備実績編集</h1>
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
