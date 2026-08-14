import Link from "next/link";
import { getVehicleFavoriteRanking } from "@/lib/engagement/queries";
import { getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { VehicleCardPrice } from "@/components/inventory/vehicle-price";
import { VehicleCardSpecs } from "@/components/inventory/vehicle-card-specs";

// 静的生成されるとお気に入り数が増えても順位が次回デプロイまで変わらないため、
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

export const metadata = buildPageMetadata({
  title: "人気ランキング",
  description:
    "お気に入り登録の多いクラシックJaguarをランキング形式でご紹介します。いま注目されている車両が分かります。",
  path: "/vehicles/ranking",
});

// SCR-PUB-005: 人気ランキング（お気に入り数を基に公開中の車両を順位表示、FR-FAV-004）
export default async function Page() {
  const ranking = await getVehicleFavoriteRanking(10);

  const leadPhotoPaths = await getLeadVehiclePhotoPaths(
    ranking.map((v) => v.id),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "在庫車両", href: "/vehicles" },
          { label: "人気ランキング" },
        ]}
      />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        人気ランキング
      </h1>
      <p className="text-foreground-muted mt-2 text-base">
        お気に入り登録数の多い車両をランキング形式で紹介します。
      </p>

      {ranking.length === 0 ? (
        // 公開直後はお気に入りが0件でランキングが作れない。
        // 文章だけで終わらせず、在庫一覧へ送る（ここで行き止まりにしない）。
        <div className="bg-cream-100 mt-8 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            まだランキングを表示できるデータがありません
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            お気に入り登録が集まると、注目されている車両がここに並びます。
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/vehicles" variant="primary" size="md">
              在庫車両を見る
            </Button>
          </div>
        </div>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {ranking.map((v, i) => {
            if (!v.slug) return null;
            const photoPath = leadPhotoPaths.get(v.id);
            const vehicleName = [
              v.manufacturers?.name,
              v.models?.name,
              v.grades?.name,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="shadow-soft ease-premium hover:border-primary-200 hover:shadow-medium flex items-stretch gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* 順位。1〜3位は色を強め、それ以降は落ち着かせる。
                      上位ほど目に留まる中古車サイトのランキング表現に合わせる。 */}
                  <span
                    aria-hidden="true"
                    className={`font-serif text-2xl font-bold tabular-nums ${
                      i < 3 ? "text-accent-500" : "text-foreground-muted"
                    }`}
                  >
                    {i + 1}
                  </span>

                  {/* 写真。一覧・お気に入りと同じく、無ければ枠だけ残して崩れないようにする */}
                  <div className="bg-cream-200 relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:block">
                    {photoPath && (
                      // eslint-disable-next-line @next/next/no-img-element -- 固定サイズのサムネイルのため最適化不要
                      <img
                        src={getVehiclePhotoPublicUrl(photoPath)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-charcoal-900 font-medium">
                      {vehicleName}
                    </p>
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
                  </div>

                  <span className="text-foreground-muted shrink-0 self-center text-sm">
                    <span aria-hidden="true">♥</span> {v.favoriteCount}
                    <span className="sr-only">件のお気に入り登録</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-10 flex justify-center border-t border-neutral-200 pt-8">
        <Button href="/vehicles" variant="outline" size="md">
          在庫車両一覧に戻る
        </Button>
      </div>
    </main>
  );
}
