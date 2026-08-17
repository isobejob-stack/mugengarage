import {
  getVehicleSearchFacetOptions,
  searchPublicVehicles,
  type VehicleSearchFilters,
} from "@/lib/inventory/search";
import { getVehiclePhotoPathsByVehicle } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/api/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { VehicleCardPhotos } from "@/components/inventory/vehicle-card-photos";
import { VehicleFeatureBadges } from "@/components/ui/status-badge";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { VehicleCardPrice } from "@/components/inventory/vehicle-price";
import {
  SelectField,
  RangeSelectField,
  PRICE_OPTIONS,
  YEAR_OPTIONS,
  MILEAGE_OPTIONS,
  DISPLACEMENT_OPTIONS,
} from "@/components/inventory/vehicle-search-fields";
import { VehicleCardSpecs } from "@/components/inventory/vehicle-card-specs";
import {
  VehicleActiveFilters,
  buildActiveFilters,
} from "@/components/inventory/vehicle-active-filters";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SiteText } from "@/components/live-edit/site-text";
import { VehicleSortSelect } from "@/components/inventory/vehicle-sort-select";
import { Pagination } from "@/components/ui/pagination";
import { FavoriteIconButton } from "@/components/engagement/favorite-icon-button";
import { getSessionId } from "@/lib/engagement/session";
import { listFavoriteVehicleIds } from "@/lib/engagement/queries";

type SearchParams = Record<string, string | undefined>;

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// 一覧の先頭何枚を優先読み込みにするか。
// スマートフォンの初期表示に入るのは概ね1〜2枚のため、そこだけ遅延読み込みを外す
// （画面外まで優先すると帯域を奪い合ってかえって遅くなる）。
const PRIORITY_IMAGE_COUNT = 2;

export const metadata = buildPageMetadata({
  title: "在庫車両",
  description:
    "エムガレージが取り扱うクラシックJaguarの在庫一覧です。Eタイプ・XK・Mark2など、年式・価格・状態からお探しいただけます。",
  path: "/vehicles",
});

// SCR-PUB-002: 車両一覧・検索結果（FR-SRCH-001〜003: 複合条件絞り込み、URLクエリでの状態保持）
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const pagination = parsePaginationParams(
    new URLSearchParams(params as Record<string, string>),
    20,
  );

  const filters: VehicleSearchFilters = {
    modelId: params.model || undefined,
    priceMin: toNumber(params.price_min),
    priceMax: toNumber(params.price_max),
    modelYearMin: toNumber(params.year_min),
    modelYearMax: toNumber(params.year_max),
    mileageMax: toNumber(params.mileage_max),
    displacementMin: toNumber(params.displacement_min),
    displacementMax: toNumber(params.displacement_max),
    sort: (params.sort as VehicleSearchFilters["sort"]) || undefined,
  };

  const sessionId = await getSessionId();
  const [{ vehicles, totalCount }, facets, favoriteIds] = await Promise.all([
    searchPublicVehicles(filters, pagination),
    getVehicleSearchFacetOptions(),
    sessionId ? listFavoriteVehicleIds(sessionId) : Promise.resolve([]),
  ]);
  const meta = buildPaginationMeta(pagination, totalCount);

  // 一覧カードで数枚めくれるようにするため、車両ごとに先頭数枚を1クエリで取得する（N+1回避）
  const photoPaths = await getVehiclePhotoPathsByVehicle(
    vehicles.map((v) => v.id),
  );
  const photoUrlsByVehicle = vehicles.map((v) =>
    (photoPaths.get(v.id) ?? []).map((p) => getVehiclePhotoPublicUrl(p)),
  );

  // 「21台中 1〜20台を表示」のための範囲。
  // 総件数だけだと、今どのあたりを見ているのかが分からない。
  const rangeStart = (meta.page - 1) * meta.per_page + 1;
  const rangeEnd = Math.min(meta.page * meta.per_page, totalCount);

  // 畳んだ絞り込みフォームの見出しに「◯件適用中」を出すために使う。
  // 表示するタグと同じ関数から数えるので、タグの数と件数がずれない。
  const activeFilterCount = buildActiveFilters(params, facets).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: "在庫車両" }]} />
      <h1 className="text-charcoal-900 mt-3 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        <SiteText k="vehicles.title" description="在庫一覧 見出し">
          在庫車両一覧
        </SiteText>
      </h1>

      {/*
        絞り込みフォームは既定で畳んでおく。
        展開したままだとスマートフォンでは縦800px以上を占め、
        「在庫一覧を開いたのに車が1台も見えない」状態になっていた。
        在庫が15台規模の店でそれをやると、品揃えが無い店に見えてしまう。
        中古車メディアもスマートフォンでは結果を先に出し、条件は畳んでいる。

        条件が付いているときは開いた状態で描画する（何で絞ったか確認しに来るため）。
        畳んでいるあいだも、適用中の条件は下のタグ列に出ているので見失わない。
      */}
      <details
        className="group mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
        open={activeFilterCount > 0}
      >
        <summary className="text-charcoal-900 hover:bg-cream-100 flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-base font-bold">
          <span>
            <SiteText k="vehicles.filter.heading" description="在庫一覧 絞り込みの見出し">
              条件を絞り込む
            </SiteText>
            {activeFilterCount > 0 && (
              <span className="text-primary-700 ml-2 text-sm font-medium">
                （{activeFilterCount}件適用中）
              </span>
            )}
          </span>
          <span
            aria-hidden="true"
            className="text-foreground-muted shrink-0 text-sm transition-transform group-open:rotate-180"
          >
            ▼
          </span>
        </summary>

        <form
          method="get"
          className="flex flex-col gap-4 border-t border-neutral-200 p-4"
        >
          {/*
            条件は5つだけに絞ってある（2026-08-17）。
            以前はここに シリーズ・世代・グレード・ミッション・駆動方式・外装色・
            車検あり・修復歴なし が並び、折りたたみの中にさらに折りたたみがあった。
            在庫15台規模でその粒度まで用意しても、ほとんどの条件は選んだ瞬間に1〜2台になる。
            色や駆動方式は「絞る条件」ではなく「見つけた車を確認する情報」なので、
            詳細ページの主要諸元に任せる。
          */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 選択肢に在庫台数を添える。中古車メディアの定石で、
              0件になる条件を選ぶ前に気付けるようにするためのもの。 */}
            <SelectField
              label="車種"
              name="model"
              defaultValue={params.model}
              options={facets.models.map((m) => ({
                value: m.id,
                label: `${m.name}（${m.count}台）`,
              }))}
            />
            {/* 一覧・詳細は支払総額を主役に出しているが、絞り込みは車両本体価格が基準。
              ラベルだけでは読み飛ばされ「200万円以下で絞ったのに総額228万円が出る」と
              検索が壊れて見えるため、基準が違うことを明記する。 */}
            <div>
              <RangeSelectField
                label="車両本体価格"
                fromName="price_min"
                toName="price_max"
                fromValue={params.price_min}
                toValue={params.price_max}
                options={PRICE_OPTIONS}
              />
              <p className="text-foreground-muted mt-1 text-sm">
                ※ 車両本体価格で絞り込みます（表示中の支払総額とは異なります）
              </p>
            </div>
            <RangeSelectField
              label="年式"
              fromName="year_min"
              toName="year_max"
              fromValue={params.year_min}
              toValue={params.year_max}
              options={YEAR_OPTIONS}
            />
            <SelectField
              label="走行距離"
              name="mileage_max"
              defaultValue={params.mileage_max}
              options={MILEAGE_OPTIONS}
              placeholder="上限なし"
            />
            <RangeSelectField
              label="排気量"
              fromName="displacement_min"
              toName="displacement_max"
              fromValue={params.displacement_min}
              toValue={params.displacement_max}
              options={DISPLACEMENT_OPTIONS}
            />
          </div>

          {/* 並び替えは検索結果の直上に移したが、条件を変えて再検索したときに
            選んでいた並び順が消えないよう、フォーム側でも引き継ぐ。 */}
          {params.sort && (
            <input type="hidden" name="sort" value={params.sort} />
          )}

          <div className="flex gap-3">
            <Button type="submit" variant="primary" size="md">
              <SiteText k="vehicles.filter.submit" description="在庫一覧 検索ボタンの文言">
                この条件で検索
              </SiteText>
            </Button>
            <Button href="/vehicles" variant="outline" size="md">
              <SiteText k="vehicles.filter.clear" description="在庫一覧 条件クリアボタンの文言">
                条件をクリア
              </SiteText>
            </Button>
          </div>
        </form>
      </details>

      <VehicleActiveFilters params={params} facets={facets} />

      {/* 件数と並び替えを結果の直上にまとめる。
          「今いくつ出ていて、どの順で並んでいるか」は必ずセットで確認されるため。 */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <p className="text-charcoal-900 text-base">
          該当{" "}
          <strong className="text-xl font-bold tabular-nums">
            {totalCount}
          </strong>
          台
          {totalCount > 0 && (
            <span className="text-foreground-muted ml-2 text-sm">
              （{rangeStart}〜{rangeEnd}台目を表示）
            </span>
          )}
        </p>
        {totalCount > 0 && <VehicleSortSelect params={params} />}
      </div>

      {vehicles.length === 0 ? (
        // 0件で行き止まりにしない。中古車は在庫が数十台規模のため条件を重ねると
        // すぐ0件になり、ここで戻る導線が無いと離脱する。
        <div className="bg-cream-100 mt-8 rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-charcoal-900 text-lg font-bold">
            <SiteText k="vehicles.empty.title" description="在庫一覧 0件のときの見出し">
              条件に一致する車両が見つかりませんでした
            </SiteText>
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            <SiteText k="vehicles.empty.body" description="在庫一覧 0件のときの説明文">
              条件を少なくすると見つかることがあります。お探しの車両が見つからない場合は、ご希望をお聞かせいただければ入荷時にご案内いたします。
            </SiteText>
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/vehicles" variant="primary" size="md">
              <SiteText k="vehicles.empty.clear" description="在庫一覧 0件のとき すべて見るボタンの文言">
                条件をクリアしてすべて見る
              </SiteText>
            </Button>
            <Button href="/contact" variant="outline" size="md">
              <SiteText k="vehicles.empty.consult" description="在庫一覧 0件のとき 相談するボタンの文言">
                希望の車両を相談する
              </SiteText>
            </Button>
          </div>
        </div>
      ) : (
        // スマホでも2列。在庫一覧を開いた瞬間に複数台が視界に入り、
        // 「他にもこんな車がある」と伝わる状態にする。
        // 1列だと1画面に1台しか入らず、15台規模の店では品揃えが無いように見える。
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 md:gap-8">
          {vehicles.map((v, index) => {
            if (!v.slug) return null;
            // グレードまで出す。「Jaguar Eタイプ」だけでは同車種内で比較にならない
            const vehicleName = [
              v.manufacturers?.name,
              v.models?.name,
              v.grades?.name,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              // お気に入りボタンをカード（リンク）の外側に重ねるため、liを基準位置にする
              <li key={v.id} className="relative">
                <FavoriteIconButton
                  vehicleId={v.id}
                  initialFavorited={favoriteIds.includes(v.id)}
                  vehicleName={vehicleName}
                />
                <Card href={`/vehicles/${v.slug}`}>
                  <VehicleFeatureBadges
                    isRecommended={v.is_recommended}
                    isNewArrival={v.is_new_arrival}
                  />
                  <VehicleCardPhotos
                    urls={photoUrlsByVehicle[index]}
                    alt={vehicleName}
                    priority={index < PRIORITY_IMAGE_COUNT}
                  />
                  <CardBody className="space-y-1 p-3 sm:space-y-2 sm:p-5">
                    <CardTitle className="text-sm leading-snug sm:text-lg">
                      {vehicleName}
                    </CardTitle>
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
      )}

      <Pagination
        basePath="/vehicles"
        params={params}
        page={meta.page}
        totalPages={meta.total_pages}
      />

      {/* 人気ランキングは以前は見出しの横にあり、結果にたどり着く前の脇道になっていた。
          一覧を見終えて「決めきれなかった」人に効く導線のため、結果の後ろに置く。 */}
      <div className="mt-10 flex justify-center border-t border-neutral-200 pt-8">
        <Button href="/vehicles/ranking" variant="outline" size="md">
          <SiteText k="vehicles.ranking.cta" description="在庫一覧 ランキングボタンの文言">
            人気の車両ランキングを見る
          </SiteText>
        </Button>
      </div>
    </main>
  );
}
