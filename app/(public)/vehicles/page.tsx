import Link from "next/link";
import {
  getVehicleSearchFacetOptions,
  searchPublicVehicles,
  type VehicleSearchFilters,
} from "@/lib/inventory/search";
import {
  parsePaginationParams,
  buildPaginationMeta,
} from "@/lib/api/pagination";

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
    priceMin: toNumber(params.price_min),
    priceMax: toNumber(params.price_max),
    modelYearMin: toNumber(params.year_min),
    modelYearMax: toNumber(params.year_max),
    mileageMax: toNumber(params.mileage_max),
    transmission: params.transmission || undefined,
    indoorStorageOnly: params.indoor === "1",
    sort: (params.sort as VehicleSearchFilters["sort"]) || undefined,
  };

  const [{ vehicles, totalCount }, facets] = await Promise.all([
    searchPublicVehicles(filters, pagination),
    getVehicleSearchFacetOptions(),
  ]);
  const meta = buildPaginationMeta(pagination, totalCount);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">在庫車両一覧</h1>
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

        <div className="flex gap-3">
          <button
            type="submit"
            className="min-h-11 rounded-md bg-blue-600 px-4 py-2 font-medium text-white"
          >
            この条件で検索
          </button>
          <Link
            href="/vehicles"
            className="min-h-11 rounded-md border border-neutral-300 px-4 py-2 text-sm"
          >
            条件をクリア
          </Link>
        </div>
      </form>

      <p className="mt-4 text-sm text-neutral-500">{totalCount}台</p>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-neutral-500">
          条件に一致する車両が見つかりませんでした。
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {vehicles.map((v) =>
            v.slug ? (
              <li key={v.id}>
                <Link
                  href={`/vehicles/${v.slug}`}
                  className="block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
                >
                  <p className="font-medium">
                    {v.manufacturers?.name} {v.models?.name}
                    {v.model_year ? `（${v.model_year}年）` : ""}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {v.mileage_km !== null
                      ? `走行距離 ${v.mileage_km.toLocaleString()}km`
                      : ""}
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    ¥{v.price.toLocaleString()}
                  </p>
                </Link>
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
