import {
  getVehicleHierarchyOptions,
  getAdminVehicleById,
} from "@/lib/inventory/queries";
import {
  listRelatedContentCandidates,
  listRelatedContents,
} from "@/lib/related/queries";
import { listTags, listTagsForTaggable } from "@/lib/tags/queries";
import { VehicleForm } from "@/components/inventory/vehicle-form";
import { toCopiedVehicleFormValues } from "@/lib/inventory/form-values";
import type { VehicleFormValues } from "@/lib/inventory/schema";

// SCR-ADM-004: 車両登録フォーム
//
// ?copy=<車両ID> を付けて開くと、その車両の内容を写した状態で始められる（2026-08-17）。
// 同じ車種の個体を続けて仕入れることが多く、諸元・説明文を毎回ゼロから入力していたため。
// 何をコピーし、何を意図的に落とすかは lib/inventory/form-values.ts に書いてある。
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string }>;
}) {
  const { copy: copyFromId } = await searchParams;

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

  let defaultValues: VehicleFormValues | undefined;
  let copiedFromName: string | null = null;

  if (copyFromId) {
    const source = await getAdminVehicleById(copyFromId);
    if (source) {
      const [related, sourceTags] = await Promise.all([
        listRelatedContents("vehicle", source.id),
        listTagsForTaggable("vehicle", source.id),
      ]);
      defaultValues = toCopiedVehicleFormValues(source, {
        related,
        tagIds: sourceTags.map((t) => t.id),
      });
      const manufacturer = options.manufacturers.find(
        (m) => m.id === source.manufacturer_id,
      );
      const model = options.models.find((m) => m.id === source.model_id);
      copiedFromName =
        [manufacturer?.name, model?.name].filter(Boolean).join(" ") ||
        "選択した車両";
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        {copiedFromName ? "車両登録（コピー）" : "車両登録"}
      </h1>

      {/* 何がコピーされ、何がコピーされていないかを登録前に伝える。
          特に写真は「コピーされたつもりで公開して、写真が1枚も無い」事故になりやすい。 */}
      {copiedFromName && (
        <div className="bg-cream-100 mt-4 rounded-lg border border-neutral-200 p-4">
          <p className="text-charcoal-900 text-base font-medium">
            「{copiedFromName}」の内容をコピーしました
          </p>
          <p className="text-foreground-muted mt-1 text-base">
            車台番号・車検満了日・走行距離・写真・動画はコピーしていません。
            公開ステータスは「非公開」から始まります。内容を確認してから登録してください。
          </p>
        </div>
      )}

      <div className="mt-6">
        <VehicleForm
          options={options}
          defaultValues={defaultValues}
          candidates={candidates}
          allTags={tags}
        />
      </div>
    </main>
  );
}
