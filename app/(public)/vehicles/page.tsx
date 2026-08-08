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
  CardMeta,
  CardPrice,
} from "@/components/ui/card";
import { VehicleFeatureBadges } from "@/components/ui/status-badge";

type SearchParams = Record<string, string | undefined>;

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

// <input type="month">の "YYYY-MM" を車検満了日の比較用に日付文字列へ変換する
function monthInputToDate(value: string | undefined, endOfMonth: boolean) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!endOfMonth) {
    return `${match[1]}-${match[2]}-01`;
  }
  // その月の末日（翌月0日目）
  const lastDay = new Date(year, month, 0).getDate();
  return `${match[1]}-${match[2]}-${String(lastDay).padStart(2, "0")}`;
}

function buildQueryString(params: SearchParams, overrides: SearchParams) {
  const merged = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value) merged.set(key, value);
  }
  const qs = merged.toString();
  return qs ? `/vehicles?${qs}` : "/vehicles";
}

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
    manufacturerId: params.manufacturer || undefined,
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
    indoorStorageOnly: params.indoor === "1",
    shakenExpiryFrom: monthInputToDate(params.shaken_from, false),
    shakenExpiryTo: monthInputToDate(params.shaken_to, true),
    displacementMin: toNumber(params.displacement_min),
    displacementMax: toNumber(params.displacement_max),
    horsepowerMin: toNumber(params.horsepower_min),
    horsepowerMax: toNumber(params.horsepower_max),
    ownerCountMax: toNumber(params.owner_count_max),
    interiorColor: params.interior_color || undefined,
    exteriorColor: params.exterior_color || undefined,
    seatMaterial: params.seat_material || undefined,
    drivetrain: params.drivetrain || undefined,
    tagId: params.tag || undefined,
    sort: (params.sort as VehicleSearchFilters["sort"]) || undefined,
  };

  // 詳細検索の条件が1つでも指定されていれば、再訪時に折りたたみを開いた状態にする
  const hasAdvancedFilters = Boolean(
    params.series ||
      params.generation ||
      params.grade ||
      params.drivetrain ||
      params.shaken_from ||
      params.shaken_to ||
      params.owner_count_max ||
      params.displacement_min ||
      params.displacement_max ||
      params.horsepower_min ||
      params.horsepower_max ||
      params.interior_color ||
      params.exterior_color ||
      params.seat_material ||
      params.tag,
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium">メーカー</span>
            <select
              name="manufacturer"
              defaultValue={params.manufacturer ?? ""}
              className="input mt-1"
            >
              <option value="">指定なし</option>
              {facets.manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">車種</span>
            <select
              name="model"
              defaultValue={params.model ?? ""}
              className="input mt-1"
            >
              <option value="">指定なし</option>
              {facets.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">ミッション</span>
            <select
              name="transmission"
              defaultValue={params.transmission ?? ""}
              className="input mt-1"
            >
              <option value="">指定なし</option>
              {facets.transmissions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">並び替え</span>
            <select
              name="sort"
              defaultValue={params.sort ?? ""}
              className="input mt-1"
            >
              <option value="">おすすめ順</option>
              <option value="new">新着順</option>
              <option value="price_asc">価格が安い順</option>
              <option value="price_desc">価格が高い順</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium">価格（下限・円）</span>
            <input
              type="number"
              name="price_min"
              defaultValue={params.price_min ?? ""}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">価格（上限・円）</span>
            <input
              type="number"
              name="price_max"
              defaultValue={params.price_max ?? ""}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">年式（下限）</span>
            <input
              type="number"
              name="year_min"
              defaultValue={params.year_min ?? ""}
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">年式（上限）</span>
            <input
              type="number"
              name="year_max"
              defaultValue={params.year_max ?? ""}
              className="input mt-1"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="block">
            <span className="text-sm font-medium">走行距離（上限・km）</span>
            <input
              type="number"
              name="mileage_max"
              defaultValue={params.mileage_max ?? ""}
              className="input mt-1"
            />
          </label>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="indoor"
              value="1"
              defaultChecked={params.indoor === "1"}
            />
            屋内保管のみ
          </label>
        </div>

        {/* FR-SRCH-001: シリーズ・世代・グレード〜駆動方式までの詳細条件（画面が煩雑にならないよう折りたたみ） */}
        <details
          className="rounded-md border border-neutral-200 p-4"
          open={hasAdvancedFilters}
        >
          <summary className="min-h-11 cursor-pointer py-2 text-base font-medium">
            詳細検索（車種階層・車検・エンジン諸元・色ほか）
          </summary>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">シリーズ</span>
              <select
                name="series"
                defaultValue={params.series ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">世代</span>
              <select
                name="generation"
                defaultValue={params.generation ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.generations.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">グレード</span>
              <select
                name="grade"
                defaultValue={params.grade ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">駆動方式</span>
              <select
                name="drivetrain"
                defaultValue={params.drivetrain ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.drivetrains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">車検残（この年月以降）</span>
              <input
                type="month"
                name="shaken_from"
                defaultValue={params.shaken_from ?? ""}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">車検残（この年月以前）</span>
              <input
                type="month"
                name="shaken_to"
                defaultValue={params.shaken_to ?? ""}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">オーナー数（上限）</span>
              <input
                type="number"
                name="owner_count_max"
                defaultValue={params.owner_count_max ?? ""}
                className="input mt-1"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">排気量（下限・cc）</span>
              <input
                type="number"
                name="displacement_min"
                defaultValue={params.displacement_min ?? ""}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">排気量（上限・cc）</span>
              <input
                type="number"
                name="displacement_max"
                defaultValue={params.displacement_max ?? ""}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">馬力（下限・PS）</span>
              <input
                type="number"
                name="horsepower_min"
                defaultValue={params.horsepower_min ?? ""}
                className="input mt-1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">馬力（上限・PS）</span>
              <input
                type="number"
                name="horsepower_max"
                defaultValue={params.horsepower_max ?? ""}
                className="input mt-1"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">内装色</span>
              <select
                name="interior_color"
                defaultValue={params.interior_color ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.interiorColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">外装色</span>
              <select
                name="exterior_color"
                defaultValue={params.exterior_color ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.exteriorColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">シート素材</span>
              <select
                name="seat_material"
                defaultValue={params.seat_material ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.seatMaterials.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* FR-SRCH-001: タグでの絞り込み（FR-INV-012で車両に付与されたタグ） */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block">
              <span className="text-sm font-medium">タグ</span>
              <select
                name="tag"
                defaultValue={params.tag ?? ""}
                className="input mt-1"
              >
                <option value="">指定なし</option>
                {facets.tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
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
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </CardTitle>
                    {v.mileage_km !== null && (
                      <CardMeta>
                        走行距離 {v.mileage_km.toLocaleString()}km
                      </CardMeta>
                    )}
                    <CardPrice>¥{v.price.toLocaleString()}</CardPrice>
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
