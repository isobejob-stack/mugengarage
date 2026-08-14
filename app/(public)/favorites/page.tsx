import { getSessionId } from "@/lib/engagement/session";
import { getPublicFavoriteVehicles } from "@/lib/engagement/queries";
import { getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { Card, CardImage, CardBody, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { VehicleCardPrice } from "@/components/inventory/vehicle-price";
import { VehicleCardSpecs } from "@/components/inventory/vehicle-card-specs";
import { FavoriteIconButton } from "@/components/engagement/favorite-icon-button";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "お気に入り",
  description: "お気に入りに登録したクラシックJaguarの一覧です。",
  path: "/favorites",
});

// SCR-PUB-004: お気に入り一覧（匿名セッションIDに紐づく車両を表示、FR-FAV-002）
//
// この画面は「気になった数台を並べて見比べる」ために存在する。
// 以前は車名・走行距離・本体価格だけのテキストカードで、写真も諸元も無く、
// 解除もできなかったため、比較にも整理にも使えなかった。
// 車両一覧と同じカードに揃え、同じ情報・同じ価格基準で見比べられるようにする。
export default async function Page() {
  const sessionId = await getSessionId();
  const vehicles = sessionId ? await getPublicFavoriteVehicles(sessionId) : [];

  const leadPhotoPaths = await getLeadVehiclePhotoPaths(
    vehicles.map((v) => v.id),
  );
  const photoUrls = vehicles.map((v) => {
    const path = leadPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : undefined;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: "お気に入り" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        お気に入り一覧
      </h1>

      {vehicles.length === 0 ? (
        // 0件を文章だけで終わらせない（01_public_ui_spec.md 6章: 車両一覧への導線を出す）
        <div className="bg-cream-100 mt-8 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            お気に入りに登録した車両はまだありません
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            在庫一覧や車両詳細のハートマークから、気になる車両を登録できます。
            登録した車両はこの画面で並べて見比べられます。
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/vehicles" variant="primary" size="md">
              気になる車両を探す
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-charcoal-900 mt-4 border-b border-neutral-200 pb-4 text-base">
            登録中{" "}
            <strong className="text-xl font-bold tabular-nums">
              {vehicles.length}
            </strong>
            台
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
            {vehicles.map((v, index) => {
              if (!v.slug) return null;
              const vehicleName = [
                v.manufacturers?.name,
                v.models?.name,
                v.grades?.name,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={v.id} className="relative">
                  {/* この画面ではハートは常に登録済み。押すと解除になる
                      （01_public_ui_spec.md 6章「お気に入り解除も可能」） */}
                  <FavoriteIconButton
                    vehicleId={v.id}
                    initialFavorited
                    vehicleName={vehicleName}
                  />
                  <Card href={`/vehicles/${v.slug}`}>
                    <CardImage src={photoUrls[index]} alt={vehicleName} />
                    <CardBody>
                      <CardTitle>{vehicleName}</CardTitle>
                      <VehicleCardPrice
                        price={v.price}
                        totalPrice={v.total_price}
                      />
                      <VehicleCardSpecs
                        modelYear={v.model_year}
                        mileageKm={v.mileage_km}
                        shakenStatus={v.shaken_status}
                        shakenExpiry={v.shaken_expiry}
                        accidentHistory={v.accident_history}
                      />
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>

          <div className="mt-10 flex justify-center border-t border-neutral-200 pt-8">
            <Button href="/vehicles" variant="outline" size="md">
              在庫車両一覧に戻る
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
