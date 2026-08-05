export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">車両詳細</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-PUB-003 ・ FR-VEH-001〜008（slug: {slug}）
      </p>
    </main>
  );
}
