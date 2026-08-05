export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">整備実績詳細</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-PUB-014 ・ FR-MNT-001〜003（slug: {slug}）
      </p>
    </main>
  );
}
