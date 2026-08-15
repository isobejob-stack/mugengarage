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
  FilterSection,
  SelectField,
  RangeSelectField,
  CheckboxField,
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
    seriesId: params.series || undefined,
    generationId: params.generation || undefined,
    gradeId: params.grade || undefined,
    priceMin: toNumber(params.price_min),
    priceMax: toNumber(params.price_max),
    modelYearMin: toNumber(params.year_min),
    modelYearMax: toNumber(params.year_max),
    mileageMax: toNumber(params.mileage_max),
    transmission: params.transmission || undefined,
    displacementMin: toNumber(params.displacement_min),
    displacementMax: toNumber(params.displacement_max),
    exteriorColor: params.exterior_color || undefined,
    drivetrain: params.drivetrain || undefined,
    shakenAvailableOnly: params.shaken === "1" || undefined,
    noAccidentOnly: params.no_accident === "1" || undefined,
    sort: (params.sort as VehicleSearchFilters["sort"]) || undefined,
  };

  // 詳細検索の条件が1つでも指定されていれば、再訪時に折りたたみを開いた状態にする
  const hasAdvancedFilters = Boolean(
    params.series ||
    params.generation ||
    params.grade ||
    params.drivetrain ||
    params.displacement_min ||
    params.displacement_max ||
    params.exterior_color,
  );

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
        在庫車両一覧
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
            条件を絞り込む
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
          <FilterSection title="基本条件">
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
            <SelectField
              label="ミッション"
              name="transmission"
              defaultValue={params.transmission}
              options={facets.transmissions.map((t) => ({
                value: t,
                label: t,
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
          </FilterSection>

          {/* 並び替えは検索結果の直上に移したが、条件を変えて再検索したときに
            選んでいた並び順が消えないよう、フォーム側でも引き継ぐ。 */}
          {params.sort && (
            <input type="hidden" name="sort" value={params.sort} />
          )}

          {/* ISSUE-006: 中古車サイトで最も使われる2条件。折りたたみの中ではなく
            常に見える位置に置く（条件を1つも開かずに絞り込める状態を作る）。 */}
          <FilterSection title="こだわり条件">
            <CheckboxField
              label="車検あり"
              name="shaken"
              defaultChecked={params.shaken === "1"}
              description="車検整備付、または車検が残っている車両"
            />
            <CheckboxField
              label="修復歴なし"
              name="no_accident"
              defaultChecked={params.no_accident === "1"}
              description="修復歴なしと確認できている車両"
            />
          </FilterSection>
          {/* FR-SRCH-001: シリーズ・世代・グレード〜駆動方式までの詳細条件（画面が煩雑にならないよう折りたたみ） */}
          <details
            className="rounded-md border border-neutral-200 p-4"
            open={hasAdvancedFilters}
          >
            <summary className="text-charcoal-900 min-h-11 cursor-pointer py-2 text-base font-medium">
              さらに細かく指定する（車種階層・エンジン諸元・色ほか）
            </summary>

            <div className="mt-4 flex flex-col gap-6">
              <FilterSection title="車種の階層">
                <SelectField
                  label="シリーズ"
                  name="series"
                  defaultValue={params.series}
                  options={facets.series.map((x) => ({
                    value: x.id,
                    label: `${x.name}（${x.count}台）`,
                  }))}
                />
                <SelectField
                  label="世代"
                  name="generation"
                  defaultValue={params.generation}
                  options={facets.generations.map((x) => ({
                    value: x.id,
                    label: `${x.name}（${x.count}台）`,
                  }))}
                />
                <SelectField
                  label="グレード"
                  name="grade"
                  defaultValue={params.grade}
                  options={facets.grades.map((x) => ({
                    value: x.id,
                    label: `${x.name}（${x.count}台）`,
                  }))}
                />
              </FilterSection>

              <FilterSection title="装備・仕様">
                <RangeSelectField
                  label="排気量"
                  fromName="displacement_min"
                  toName="displacement_max"
                  fromValue={params.displacement_min}
                  toValue={params.displacement_max}
                  options={DISPLACEMENT_OPTIONS}
                />
                <SelectField
                  label="駆動方式"
                  name="drivetrain"
                  defaultValue={params.drivetrain}
                  options={facets.drivetrains.map((d) => ({
                    value: d,
                    label: d,
                  }))}
                />
                <SelectField
                  label="外装色"
                  name="exterior_color"
                  defaultValue={params.exterior_color}
                  options={facets.exteriorColors.map((c) => ({
                    value: c,
                    label: c,
                  }))}
                />
              </FilterSection>
            </div>
          </details>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" size="md">
              この条件で検索
            </Button>
            <Button href="/vehicles" variant="outline" size="md">
              条件をクリア
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
            条件に一致する車両が見つかりませんでした
          </p>
          <p className="text-foreground-muted mt-2 text-base">
            条件を少なくすると見つかることがあります。
            お探しの車両が見つからない場合は、ご希望をお聞かせいただければ
            入荷時にご案内いたします。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/vehicles" variant="primary" size="md">
              条件をクリアしてすべて見る
            </Button>
            <Button href="/contact" variant="outline" size="md">
              希望の車両を相談する
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
          人気の車両ランキングを見る
        </Button>
      </div>
    </main>
  );
}
