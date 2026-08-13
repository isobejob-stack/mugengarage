import Link from "next/link";
import {
  getVehicleSearchFacetOptions,
  searchPublicVehicles,
  type VehicleSearchFilters,
} from "@/lib/inventory/search";
import { getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/api/pagination";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardImage,
  CardBody,
  CardTitle,
} from "@/components/ui/card";
import { VehicleFeatureBadges } from "@/components/ui/status-badge";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { VehicleCardPrice } from "@/components/inventory/vehicle-price";
import {
  FilterSection,
  SelectField,
  RangeSelectField,
  PRICE_OPTIONS,
  YEAR_OPTIONS,
  MILEAGE_OPTIONS,
  DISPLACEMENT_OPTIONS,
} from "@/components/inventory/vehicle-search-fields";
import { VehicleCardSpecs } from "@/components/inventory/vehicle-card-specs";

type SearchParams = Record<string, string | undefined>;

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function buildQueryString(params: SearchParams, overrides: SearchParams) {
  const merged = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value) merged.set(key, value);
  }
  const qs = merged.toString();
  return qs ? `/vehicles?${qs}` : "/vehicles";
}

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

  const [{ vehicles, totalCount }, facets] = await Promise.all([
    searchPublicVehicles(filters, pagination),
    getVehicleSearchFacetOptions(),
  ]);
  const meta = buildPaginationMeta(pagination, totalCount);

  // 一覧表示用に、各車両の先頭写真のみを1クエリでまとめて取得する（N+1クエリ回避）
  const leadPhotoPaths = await getLeadVehiclePhotoPaths(vehicles.map((v) => v.id));
  const photoUrls = vehicles.map((v) => {
    const path = leadPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : undefined;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
          在庫車両一覧
        </h1>
        <Link href="/vehicles/ranking" className="text-sm hover:underline">
          人気ランキングを見る
        </Link>
      </div>

      <form
        method="get"
        className="mt-6 flex flex-col gap-4 rounded-md border border-neutral-200 p-4"
      >
        <FilterSection title="条件を選ぶ">
          <SelectField
            label="車種"
            name="model"
            defaultValue={params.model}
            options={facets.models.map((m) => ({ value: m.id, label: m.name }))}
          />
          <SelectField
            label="ミッション"
            name="transmission"
            defaultValue={params.transmission}
            options={facets.transmissions.map((t) => ({ value: t, label: t }))}
          />
          <RangeSelectField
            label="車両本体価格"
            fromName="price_min"
            toName="price_max"
            fromValue={params.price_min}
            toValue={params.price_max}
            options={PRICE_OPTIONS}
          />
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
          <SelectField
            label="並び替え"
            name="sort"
            defaultValue={params.sort}
            options={[
              { value: "new", label: "新着順" },
              { value: "price_asc", label: "価格が安い順" },
              { value: "price_desc", label: "価格が高い順" },
            ]}
            placeholder="おすすめ順"
          />
        </FilterSection>
        {/* FR-SRCH-001: シリーズ・世代・グレード〜駆動方式までの詳細条件（画面が煩雑にならないよう折りたたみ） */}
        <details
          className="rounded-md border border-neutral-200 p-4"
          open={hasAdvancedFilters}
        >
          <summary className="min-h-11 cursor-pointer py-2 text-base font-medium text-charcoal-900">
            詳細検索（車種階層・車検・エンジン諸元・色ほか）
          </summary>

          <div className="mt-4 flex flex-col gap-6">
            <FilterSection title="車種の階層">
              <SelectField
                label="シリーズ"
                name="series"
                defaultValue={params.series}
                options={facets.series.map((x) => ({ value: x.id, label: x.name }))}
              />
              <SelectField
                label="世代"
                name="generation"
                defaultValue={params.generation}
                options={facets.generations.map((x) => ({ value: x.id, label: x.name }))}
              />
              <SelectField
                label="グレード"
                name="grade"
                defaultValue={params.grade}
                options={facets.grades.map((x) => ({ value: x.id, label: x.name }))}
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
                options={facets.drivetrains.map((d) => ({ value: d, label: d }))}
              />
              <SelectField
                label="外装色"
                name="exterior_color"
                defaultValue={params.exterior_color}
                options={facets.exteriorColors.map((c) => ({ value: c, label: c }))}
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

      <p className="mt-4 text-sm text-neutral-500">{totalCount}台</p>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          条件に一致する車両が見つかりませんでした。
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8">
          {vehicles.map((v, index) =>
            v.slug ? (
              <li key={v.id}>
                <Card href={`/vehicles/${v.slug}`}>
                  <VehicleFeatureBadges
                    isRecommended={v.is_recommended}
                    isNewArrival={v.is_new_arrival}
                  />
                  <CardImage
                    src={photoUrls[index]}
                    alt={`${v.manufacturers?.name ?? ""} ${v.models?.name ?? ""}`}
                  />
                  <CardBody>
                    <CardTitle>
                      {v.manufacturers?.name} {v.models?.name}
                    </CardTitle>
                    <VehicleCardPrice price={v.price} totalPrice={v.total_price} />
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
            ) : null,
          )}
        </ul>
      )}

      {meta.total_pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {meta.page > 1 && (
            <Link
              href={buildQueryString(params, { page: String(meta.page - 1) })}
              className="min-h-11 rounded-md border border-neutral-300 px-4 py-2 text-sm"
            >
              前へ
            </Link>
          )}
          <span className="text-sm text-neutral-500">
            {meta.page} / {meta.total_pages}
          </span>
          {meta.page < meta.total_pages && (
            <Link
              href={buildQueryString(params, { page: String(meta.page + 1) })}
              className="min-h-11 rounded-md border border-neutral-300 px-4 py-2 text-sm"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
