export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ブログ記事編集</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-ADM-010 ・ FR-BLOG-001〜005（id: {id}）
      </p>
    </main>
  );
}
