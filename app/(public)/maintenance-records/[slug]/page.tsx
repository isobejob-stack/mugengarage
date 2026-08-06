import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicMaintenanceRecordBySlug } from "@/lib/maintenance/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";

// SCR-PUB-014: 整備実績詳細（故障事例・費用感・作業ポイント、関連車種・図鑑・ブログ）
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await getPublicMaintenanceRecordBySlug(slug);

  if (!record) {
    notFound();
  }

  const related = await listRelatedContents("maintenance_record", record.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {record.category && (
        <p className="text-sm text-neutral-500">{record.category}</p>
      )}
      <h1 className="mt-1 text-2xl font-bold">{record.title}</h1>

      {record.issue_description && (
        <section className="mt-6 rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-medium text-neutral-500">故障事例</h2>
          <p className="mt-1 whitespace-pre-wrap">{record.issue_description}</p>
        </section>
      )}

      {record.cost !== null && (
        <p className="mt-4 text-sm text-neutral-600">
          費用目安：{record.cost.toLocaleString("ja-JP")}円
        </p>
      )}

      <div className="prose mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{record.body}</ReactMarkdown>
      </div>

      <RelatedContentList
        items={related}
        title="関連車種・関連図鑑・関連ブログ"
      />
    </main>
  );
}
