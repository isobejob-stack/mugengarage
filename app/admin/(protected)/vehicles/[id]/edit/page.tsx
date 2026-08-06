import { notFound } from "next/navigation";
import {
  getAdminVehicleById,
  getVehicleHierarchyOptions,
} from "@/lib/inventory/queries";
import { VehicleForm } from "@/components/inventory/vehicle-form";
import type { VehicleFormValues } from "@/lib/inventory/schema";

// SCR-ADM-004: 車両編集フォーム
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, options] = await Promise.all([
    getAdminVehicleById(id),
    getVehicleHierarchyOptions(),
  ]);

  if (!vehicle) {
    notFound();
  }

  const defaultValues: VehicleFormValues = {
    manufacturer_id: vehicle.manufacturer_id,
    model_id: vehicle.model_id,
    series_id: vehicle.series_id,
    generation_id: vehicle.generation_id,
    grade_id: vehicle.grade_id,
    status: vehicle.status,
    is_recommended: vehicle.is_recommended,
    is_new_arrival: vehicle.is_new_arrival,
    price: vehicle.price,
    engine: vehicle.engine,
    engine_model_code: vehicle.engine_model_code,
    displacement_cc: vehicle.displacement_cc,
    horsepower: vehicle.horsepower,
    torque: vehicle.torque,
    transmission: vehicle.transmission,
    drivetrain: vehicle.drivetrain,
    body_type: vehicle.body_type,
    model_year: vehicle.model_year,
    registration_year: vehicle.registration_year,
    mileage_km: vehicle.mileage_km,
    shaken_expiry: vehicle.shaken_expiry,
    owner_count: vehicle.owner_count,
    indoor_storage: vehicle.indoor_storage,
    accident_history: vehicle.accident_history,
    interior_color: vehicle.interior_color,
    exterior_color: vehicle.exterior_color,
    seat_material: vehicle.seat_material,
    vin: vehicle.vin,
    sales_comment: vehicle.sales_comment,
    manager_comment: vehicle.manager_comment,
    story: vehicle.story,
    sourcing_background: vehicle.sourcing_background,
    appeal_points: vehicle.appeal_points,
    engine_features: vehicle.engine_features,
    common_issues: vehicle.common_issues,
    maintenance_cost: vehicle.maintenance_cost,
    purchase_notes: vehicle.purchase_notes,
    recommended_points: vehicle.recommended_points,
    maintenance_details: vehicle.maintenance_details,
    custom_details: vehicle.custom_details,
    other_notes: vehicle.other_notes,
    scheduled_publish_at: vehicle.scheduled_publish_at,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">車両編集</h1>
      <div className="mt-6">
        <VehicleForm
          options={options}
          vehicleId={vehicle.id}
          defaultValues={defaultValues}
        />
      </div>
    </main>
  );
}
