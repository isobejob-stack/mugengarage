import type { Vehicle } from "@/lib/inventory/types";

// FR-SEO-002: 車両詳細ページ用のSchema.org構造化データ（JSON-LD）を生成する。
// schema.orgの Car（Vehicle ⊂ Product のサブタイプ）を用い、中古車販売店向けの
// Google Vehicle Listing構造化データの形式に準拠する。
export function buildVehicleStructuredData(params: {
  vehicle: Vehicle & {
    manufacturers: { name: string } | null;
    models: { name: string } | null;
  };
  name: string;
  description: string | null;
  images: string[];
  url: string;
}) {
  const { vehicle, name, description, images, url } = params;

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name,
    url,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(vehicle.manufacturers?.name
      ? { brand: { "@type": "Brand", name: vehicle.manufacturers.name } }
      : {}),
    ...(vehicle.models?.name ? { model: vehicle.models.name } : {}),
    ...(vehicle.model_year
      ? { vehicleModelDate: String(vehicle.model_year) }
      : {}),
    ...(vehicle.vin ? { vehicleIdentificationNumber: vehicle.vin } : {}),
    ...(vehicle.body_type ? { bodyType: vehicle.body_type } : {}),
    ...(vehicle.transmission
      ? { vehicleTransmission: vehicle.transmission }
      : {}),
    ...(vehicle.drivetrain
      ? { driveWheelConfiguration: vehicle.drivetrain }
      : {}),
    ...(vehicle.exterior_color ? { color: vehicle.exterior_color } : {}),
    ...(vehicle.owner_count !== null
      ? { numberOfPreviousOwners: vehicle.owner_count }
      : {}),
    ...(vehicle.mileage_km !== null
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: vehicle.mileage_km,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(vehicle.engine
      ? {
          vehicleEngine: {
            "@type": "EngineSpecification",
            name: vehicle.engine,
            ...(vehicle.horsepower
              ? {
                  enginePower: {
                    "@type": "QuantitativeValue",
                    value: vehicle.horsepower,
                    unitText: "PS",
                  },
                }
              : {}),
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "JPY",
      // このJSON-LDはstatus='published'の車両詳細ページでのみ出力される（getPublicVehicleBySlug参照）
      availability: "https://schema.org/InStock",
      url,
    },
  };

  return structuredData;
}
