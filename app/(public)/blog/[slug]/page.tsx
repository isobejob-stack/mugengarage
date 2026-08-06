import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicArticleBySlug } from "@/lib/content/queries";

// SCR-PUB-007: ブログ詳細
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {article.category && (
        <p className="text-sm text-neutral-500">{article.category}</p>
      )}
      <h1 className="mt-1 text-2xl font-bold">{article.title}</h1>
      {article.published_at && (
        <p className="mt-1 text-sm text-neutral-400">
          {new Date(article.published_at).toLocaleDateString("ja-JP")}
        </p>
      )}

      <div className="prose mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.body}
        </ReactMarkdown>
      </div>
    </main>
  );
}
