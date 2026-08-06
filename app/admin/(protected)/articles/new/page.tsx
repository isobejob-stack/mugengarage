import { ArticleForm } from "@/components/content/article-form";

// SCR-ADM-010: ブログ記事新規作成
export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">記事作成</h1>
      <div className="mt-6">
        <ArticleForm />
      </div>
    </main>
  );
}
