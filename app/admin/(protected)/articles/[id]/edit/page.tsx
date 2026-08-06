import { notFound } from "next/navigation";
import { getAdminArticleById } from "@/lib/content/queries";
import { ArticleForm } from "@/components/content/article-form";
import type { ArticleFormValues } from "@/lib/content/schema";
import { getSeoMeta } from "@/lib/seo/queries";
import { listTags, listTagsForTaggable } from "@/lib/tags/queries";

// SCR-ADM-010: ブログ記事編集
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, seoMeta, allTags, articleTags] = await Promise.all([
    getAdminArticleById(id),
    // FR-BLOG-005: SEO編集フォームの初期値として、SEOメタ情報も併せて取得する
    getSeoMeta("article", id),
    // FR-BLOG-002: タグ選択候補・現在の紐付けタグ
    listTags(),
    listTagsForTaggable("article", id),
  ]);

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
    tags: articleTags.map((t) => t.id),
    seo: {
      title: seoMeta?.title ?? null,
      description: seoMeta?.description ?? null,
      og_image_url: seoMeta?.og_image_url ?? null,
      canonical_url: seoMeta?.canonical_url ?? null,
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">記事編集</h1>
      <div className="mt-6">
        <ArticleForm
          articleId={article.id}
          defaultValues={defaultValues}
          allTags={allTags}
        />
      </div>
    </main>
  );
}
