import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicMaintenanceRecordBySlug } from "@/lib/maintenance/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { buildLineConsultationUrl } from "@/lib/site-config";

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

      {/* FR-LINE-002: 整備実績詳細ページでは「修理」カテゴリに固定した相談導線を表示する。
          レビュー指摘対応（必須修正3）: プリフィル文言に整備実績タイトルを含め、ボタン文言と送信内容を一致させる */}
      <div className="mt-4">
        <a
          href={buildLineConsultationUrl("repair", record.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 w-fit items-center justify-center rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white"
        >
          同じような症状をLINEで相談する
        </a>
      </div>

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
