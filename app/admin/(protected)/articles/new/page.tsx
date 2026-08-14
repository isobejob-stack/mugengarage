import { ArticleForm } from "@/components/content/article-form";
import { listTags } from "@/lib/tags/queries";

// SCR-ADM-010: ブログ記事新規作成
export default async function Page() {
  // FR-BLOG-002: タグ選択候補
  const tags = await listTags();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        記事作成
      </h1>
      <div className="mt-6">
        <ArticleForm allTags={tags} />
      </div>
    </main>
  );
}
