import { listRelatedContents } from "@/lib/related/queries";
import { getAutoRelatedForVehicle } from "@/lib/related/auto";
import { getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { RelatedContentList } from "@/components/related/related-content-list";
import {
  KnowledgeLinksSection,
  SimilarVehiclesSection,
} from "@/components/related/related-discovery";

// 車両詳細の最下部にある「関連コンテンツ／もっと知る／似ている車両」をまとめた区画。
//
// なぜ本体から切り出したか（2026-08-25）:
// この3つを出すための読み込みが、車両詳細の表示時間の大半を占めていた。実測では
// 詳細ページのDB往復15回・直列5段のうち、後半3段（図鑑・年表・ライブラリ・記事の全件読み、
// 似ている車両の検索、その車両のslugと写真の取得）がここのためのものだった。
// これらはすべてスクロールしないと見えない位置にあるのに、
// 「価格・写真・諸元」という真っ先に見たいものの表示を最後まで止めていた。
//
// 呼び出し側で <Suspense> に包むことで、上の本体を先に返し、
// ここは用意ができ次第あとから流し込む（表示位置は変わらない）。
export async function VehicleDiscoverySections({
  vehicleId,
  modelId,
  modelYear,
  models,
}: {
  vehicleId: string;
  modelId: string | null;
  modelYear: number | null;
  models: { name: string } | null;
}) {
  // 手動指定と自動判定は互いに独立しているので同時に走らせる
  const [related, { similarVehicles, knowledge }] = await Promise.all([
    listRelatedContents("vehicle", vehicleId),
    getAutoRelatedForVehicle({
      id: vehicleId,
      model_id: modelId,
      model_year: modelYear,
      models,
    }),
  ]);

  // 手動で紐付けたものと重複する自動判定は落とす
  const manualKeys = new Set(related.map((r) => `${r.type}:${r.id}`));
  const autoKnowledge = knowledge.filter(
    (item) => !manualKeys.has(`${item.type}:${item.id}`),
  );

  const similarPhotoPaths = await getLeadVehiclePhotoPaths(
    similarVehicles.map((v) => v.id),
  );
  const similarPhotoUrls = similarVehicles.map((v) => {
    const path = similarPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : undefined;
  });

  return (
    <>
      <RelatedContentList items={related} title="関連コンテンツ" />

      {/* 手動で紐付いていないぶんを自動判定で補う（lib/related/auto.ts）。
          「この車をもっと知りたい」から図鑑・年表・整備実績へ進めるようにする。 */}
      <KnowledgeLinksSection
        items={autoKnowledge}
        title={`${models?.name ?? "この車"}をもっと知る`}
        description="この車種にまつわる解説・歴史・整備の記録です。"
      />

      <SimilarVehiclesSection
        vehicles={similarVehicles}
        photoUrls={similarPhotoUrls}
      />
    </>
  );
}

// 流し込みが終わるまでの場所取り。
// 高さを確保しておかないと、あとから現れたときに下の「一覧に戻る」等が
// 押し下げられて、読んでいる位置がずれる（CLS）。
export function VehicleDiscoverySectionsFallback() {
  return (
    <div className="mt-16" aria-hidden="true">
      <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="shadow-soft overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            <div className="aspect-[4/3] w-full animate-pulse bg-neutral-200" />
            <div className="space-y-2 p-3 sm:p-5">
              <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
