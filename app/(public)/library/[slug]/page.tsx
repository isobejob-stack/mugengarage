import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicLibraryEntryBySlug } from "@/lib/library/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";

// 各詳細ページに固有のtitle/descriptionを与える。従来はルートlayoutの値を継承しており、
// 検索結果でどのページも同じ文言になっていた（docs/tasks/ISSUE-005）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublicLibraryEntryBySlug(slug);

  if (!entry) return {};

  return buildPageMetadata({
    title: entry.title,
    description:
      excerptFromMarkdown(entry.body) || "クラシックJaguarの用語解説です。",
    path: `/library/${slug}`,
  });
}

// SCR-PUB-012: ライブラリ詳細（用語集・図鑑・ブログへの相互リンク、FR-LIB-002）
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicLibraryEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const related = await listRelatedContents("library_entry", entry.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {entry.category && (
        <p className="text-foreground-muted text-sm">{entry.category}</p>
      )}
      <h1 className="text-charcoal-900 mt-1 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {entry.title}
      </h1>

      <div className="prose mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
      </div>

      <RelatedContentList
        items={related}
        title="関連する用語集・図鑑・ブログ"
      />
    </main>
  );
}
