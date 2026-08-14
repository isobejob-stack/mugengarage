import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicMaintenanceRecordBySlug } from "@/lib/maintenance/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { buildLineConsultationUrl } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings/queries";
import { Button } from "@/components/ui/button";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";

// 各詳細ページに固有のtitle/descriptionを与える。従来はルートlayoutの値を継承しており、
// 検索結果でどのページも同じ文言になっていた（docs/tasks/ISSUE-005）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = await getPublicMaintenanceRecordBySlug(slug);

  if (!record) return {};

  return buildPageMetadata({
    title: record.title,
    description:
      excerptFromMarkdown(record.body) || "クラシックJaguarの整備実績です。",
    path: `/maintenance-records/${slug}`,
  });
}

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

  const [related, settings] = await Promise.all([
    listRelatedContents("maintenance_record", record.id),
    getSiteSettings(),
  ]);
  const lineConsultUrl = buildLineConsultationUrl(
    settings.line_url,
    "repair",
    record.title,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {record.category && (
        <p className="text-foreground-muted text-sm">{record.category}</p>
      )}
      <h1 className="text-charcoal-900 mt-1 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {record.title}
      </h1>

      {/* FR-LINE-002: 整備実績詳細ページでは「修理」カテゴリに固定した相談導線を表示する。
          レビュー指摘対応（必須修正3）: プリフィル文言に整備実績タイトルを含め、ボタン文言と送信内容を一致させる。
          LINEのURLが未設定のあいだはボタンを出さない。 */}
      {lineConsultUrl && (
        <div className="mt-4">
          <Button href={lineConsultUrl} variant="line" size="md">
            同じような症状をLINEで相談する
          </Button>
        </div>
      )}

      {record.issue_description && (
        <section className="bg-cream-50 shadow-soft mt-6 rounded-xl border border-neutral-200 p-4">
          <h2 className="text-foreground-muted text-sm font-medium">
            故障事例
          </h2>
          <p className="text-charcoal-900 mt-1 whitespace-pre-wrap">
            {record.issue_description}
          </p>
        </section>
      )}

      {record.cost !== null && (
        <p className="text-foreground-muted mt-4 text-sm">
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
