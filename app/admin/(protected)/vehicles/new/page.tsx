import { getVehicleHierarchyOptions } from "@/lib/inventory/queries";
import { listRelatedContentCandidates } from "@/lib/related/queries";
import { listTags } from "@/lib/tags/queries";
import { VehicleForm } from "@/components/inventory/vehicle-form";

// SCR-ADM-004: 車両登録フォーム
export default async function Page() {
  const [options, candidates, tags] = await Promise.all([
    getVehicleHierarchyOptions(),
    // FR-INV-014: 関連記事／関連図鑑／関連ブログ／関連整備実績の紐付け候補
    listRelatedContentCandidates([
      "article",
      "encyclopedia_entry",
      "library_entry",
      "maintenance_record",
    ]),
    // FR-INV-012: タグ選択候補
    listTags(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        車両登録
      </h1>
      <div className="mt-6">
        <VehicleForm options={options} candidates={candidates} allTags={tags} />
      </div>
    </main>
  );
}
