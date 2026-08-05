export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ライブラリ編集</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-ADM-016 ・ FR-LIB-001, FR-LIB-002（id: {id}）
      </p>
    </main>
  );
}
