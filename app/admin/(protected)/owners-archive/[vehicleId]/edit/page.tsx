import { notFound } from "next/navigation";
import { getAdminOwnerArchiveEntry } from "@/lib/archive/queries";
import { getAdminVehicleById } from "@/lib/inventory/queries";
import { OwnerArchiveForm } from "@/components/archive/owner-archive-form";
import type { OwnerArchiveEntryFormValues } from "@/lib/archive/schema";

// SCR-ADM-019: 車両が「売約済」になったタイミングで案内される専用編集画面
export default async function Page({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const [entry, vehicle] = await Promise.all([
    getAdminOwnerArchiveEntry(vehicleId),
    getAdminVehicleById(vehicleId),
  ]);

  if (!entry || !vehicle) {
    notFound();
  }

  const defaultValues: OwnerArchiveEntryFormValues = {
    restoration_history: entry.restoration_history,
    sales_history: entry.sales_history,
    owner_comment: entry.owner_comment,
    is_published: entry.is_published,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        オーナーズアーカイブ管理
      </h1>
      <p className="mt-2 text-base text-foreground-muted">
        {vehicle.model_year ? `${vehicle.model_year}年 ` : ""}
        車両ID: {vehicleId}
      </p>
      <div className="mt-6">
        <OwnerArchiveForm vehicleId={vehicleId} defaultValues={defaultValues} />
      </div>
    </main>
  );
}
