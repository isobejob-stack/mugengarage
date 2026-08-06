import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicVehicleBySlug } from "@/lib/inventory/queries";
import { VehicleStatusBadge } from "@/components/ui/status-badge";

// SCR-PUB-003: 車両詳細（FR-VEH-001, 002, 008。写真ギャラリー・関連コンテンツ等は今後実装）
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getPublicVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  const markdownSections: Array<[string, string | null]> = [
    ["この車の魅力", vehicle.appeal_points],
    ["販売コメント", vehicle.sales_comment],
    ["店長コメント", vehicle.manager_comment],
    ["ストーリー", vehicle.story],
    ["エンジンの特徴", vehicle.engine_features],
    ["よくある故障", vehicle.common_issues],
    ["維持費", vehicle.maintenance_cost],
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <VehicleStatusBadge status={vehicle.status} />
      <h1 className="mt-2 text-2xl font-bold">
        {vehicle.manufacturers?.name} {vehicle.models?.name}
        {vehicle.model_year ? `（${vehicle.model_year}年）` : ""}
      </h1>
      <p className="mt-2 text-2xl font-bold">
        ¥{vehicle.price.toLocaleString()}
      </p>

      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          {vehicle.mileage_km !== null && (
            <Row
              label="走行距離"
              value={`${vehicle.mileage_km.toLocaleString()}km`}
            />
          )}
          {vehicle.engine && <Row label="エンジン" value={vehicle.engine} />}
          {vehicle.transmission && (
            <Row label="ミッション" value={vehicle.transmission} />
          )}
          {vehicle.exterior_color && (
            <Row label="外装色" value={vehicle.exterior_color} />
          )}
          {vehicle.interior_color && (
            <Row label="内装色" value={vehicle.interior_color} />
          )}
          {vehicle.vin && <Row label="VIN" value={vehicle.vin} />}
        </tbody>
      </table>

      {markdownSections
        .filter(([, body]) => Boolean(body))
        .map(([title, body]) => (
          <section key={title} className="mt-8">
            <h2 className="text-lg font-bold">{title}</h2>
            <div className="prose mt-2 max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            </div>
          </section>
        ))}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-neutral-200">
      <th className="w-32 py-2 text-left font-medium text-neutral-500">
        {label}
      </th>
      <td className="py-2">{value}</td>
    </tr>
  );
}
