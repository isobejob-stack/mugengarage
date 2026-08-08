import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicMaintenanceRecordBySlug } from "@/lib/maintenance/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { buildLineConsultationUrl } from "@/lib/site-config";
import { Button } from "@/components/ui/button";

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
        <p className="text-sm text-foreground-muted">{record.category}</p>
      )}
      <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        {record.title}
      </h1>

      {/* FR-LINE-002: 整備実績詳細ページでは「修理」カテゴリに固定した相談導線を表示する。
          レビュー指摘対応（必須修正3）: プリフィル文言に整備実績タイトルを含め、ボタン文言と送信内容を一致させる */}
      <div className="mt-4">
        <Button
          href={buildLineConsultationUrl("repair", record.title)}
          variant="line"
          size="md"
        >
          同じような症状をLINEで相談する
        </Button>
      </div>

      {record.issue_description && (
        <section className="mt-6 rounded-xl border border-neutral-200 bg-cream-50 p-4 shadow-soft">
          <h2 className="text-sm font-medium text-foreground-muted">
            故障事例
          </h2>
          <p className="mt-1 whitespace-pre-wrap text-charcoal-900">
            {record.issue_description}
          </p>
        </section>
      )}

      {record.cost !== null && (
        <p className="mt-4 text-sm text-foreground-muted">
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
