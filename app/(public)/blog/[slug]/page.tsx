import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicArticleBySlug } from "@/lib/content/queries";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";

// 各詳細ページに固有のtitle/descriptionを与える。従来はルートlayoutの値を継承しており、
// 検索結果でどのページも同じ文言になっていた（docs/tasks/ISSUE-005）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) return {};

  return buildPageMetadata({
    title: article.title,
    description:
      excerptFromMarkdown(article.body) || "クラシックJaguarに関する記事です。",
    path: `/blog/${slug}`,
  });
}

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
      <Breadcrumb
        items={[{ label: "ブログ", href: "/blog" }, { label: article.title }]}
      />
      {article.category && (
        <p className="text-foreground-muted text-sm">{article.category}</p>
      )}
      <h1 className="text-charcoal-900 mt-1 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {article.title}
      </h1>
      {article.published_at && (
        <p className="text-foreground-muted mt-1 text-sm">
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
