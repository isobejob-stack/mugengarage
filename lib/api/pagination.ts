// pagination.md 3章: オフセットベースページネーション

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

const MAX_PER_PAGE = 100;

// URLSearchParamsからpage/per_pageを取り出す。不正値・上限超過はデフォルト/上限に丸める。
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultPerPage: number,
): PaginationParams {
  const rawPage = Number(searchParams.get("page"));
  const rawPerPage = Number(searchParams.get("per_page"));

  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const perPage =
    Number.isInteger(rawPerPage) && rawPerPage > 0
      ? Math.min(rawPerPage, MAX_PER_PAGE)
      : defaultPerPage;

  return { page, perPage };
}

export function buildPaginationMeta(
  { page, perPage }: PaginationParams,
  totalCount: number,
): PaginationMeta {
  return {
    page,
    per_page: perPage,
    total_count: totalCount,
    total_pages: Math.max(1, Math.ceil(totalCount / perPage)),
  };
}

// Supabase .range(from, to) 用のオフセット計算
export function toRange({ page, perPage }: PaginationParams): [number, number] {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  return [from, to];
}
