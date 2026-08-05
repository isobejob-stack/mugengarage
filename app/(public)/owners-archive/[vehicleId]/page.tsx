export default async function Page({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">オーナーズアーカイブ詳細</h1>
      <p className="mt-2 text-sm text-neutral-500">
        SCR-PUB-016 ・ FR-OWN-001〜003（vehicleId: {vehicleId}）
      </p>
    </main>
  );
}
