export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">顧客詳細（タイムライン）</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-ADM-006 ・ FR-CRM-002〜005（id: {id}）
      </p>
    </main>
  );
}
