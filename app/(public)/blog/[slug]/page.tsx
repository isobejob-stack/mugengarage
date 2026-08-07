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
        <p className="text-sm text-foreground-muted">{article.category}</p>
      )}
      <h1 className="mt-1 font-serif text-2xl font-bold text-charcoal-900">
        {article.title}
      </h1>
      {article.published_at && (
        <p className="mt-1 text-sm text-foreground-muted">
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
