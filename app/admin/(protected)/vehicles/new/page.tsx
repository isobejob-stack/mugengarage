import { getVehicleHierarchyOptions } from "@/lib/inventory/queries";
import { VehicleForm } from "@/components/inventory/vehicle-form";

// SCR-ADM-004: 車両登録フォーム
export default async function Page() {
  const options = await getVehicleHierarchyOptions();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">車両登録</h1>
      <div className="mt-6">
        <VehicleForm options={options} />
      </div>
    </main>
  );
}
