export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ブログ詳細</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-PUB-007 ・ FR-BLOG-001, FR-BLOG-005（slug: {slug}）
      </p>
    </main>
  );
}
