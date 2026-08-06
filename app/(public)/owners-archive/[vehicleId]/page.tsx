import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicOwnerArchiveEntryByVehicleId } from "@/lib/archive/queries";

// SCR-PUB-016: オーナーズアーカイブ詳細（レストア履歴・販売履歴、FR-OWN-001〜003）
export default async function Page({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const entry = await getPublicOwnerArchiveEntryByVehicleId(vehicleId);

  if (!entry) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs font-medium text-neutral-500">ご成約済み</p>
      <h1 className="mt-1 text-2xl font-bold">
        {entry.vehicles?.manufacturers?.name} {entry.vehicles?.models?.name}
        {entry.vehicles?.model_year ? `（${entry.vehicles.model_year}年）` : ""}
      </h1>
      {entry.vehicles?.engine && (
        <p className="mt-2 text-neutral-600">{entry.vehicles.engine}</p>
      )}

      {entry.restoration_history && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">レストア履歴</h2>
          <div className="prose mt-2 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {entry.restoration_history}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {entry.sales_history && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">販売履歴</h2>
          <div className="prose mt-2 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {entry.sales_history}
            </ReactMarkdown>
          </div>
        </section>
      )}
    </main>
  );
}
