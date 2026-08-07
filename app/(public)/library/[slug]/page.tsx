import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicLibraryEntryBySlug } from "@/lib/library/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";

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
        <p className="text-sm text-foreground-muted">{entry.category}</p>
      )}
      <h1 className="mt-1 font-serif text-2xl font-bold text-charcoal-900">
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
