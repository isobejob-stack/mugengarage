import { notFound } from "next/navigation";
import { getAdminArticleById } from "@/lib/content/queries";
import { ArticleForm } from "@/components/content/article-form";
import type { ArticleFormValues } from "@/lib/content/schema";

// SCR-ADM-010: ブログ記事編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getAdminArticleById(id);

  if (!article) {
    notFound();
  }

  const defaultValues: ArticleFormValues = {
    title: article.title,
    slug: article.slug,
    body: article.body,
    status: article.status,
    category: article.category,
    scheduled_publish_at: article.scheduled_publish_at,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">記事編集</h1>
      <div className="mt-6">
        <ArticleForm articleId={article.id} defaultValues={defaultValues} />
      </div>
    </main>
  );
}
