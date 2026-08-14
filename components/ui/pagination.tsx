import Link from "next/link";

// ページ送り。
//
// 従来は「前へ / 3 / 5 / 次へ」の形で、目的のページへ直接飛べなかった。
// 「次へ」を押し続けないと後ろのページに行けないのは、件数が増えるほど負担が大きい。
// 中古車メディアは例外なくページ番号を並べており、利用者が最も慣れている形でもある。
//
// ページ数が多い場合に番号を全部並べると折り返して読めなくなるため、
// 「先頭・末尾・現在地の前後」だけを出し、間は「…」で省略する。

type SearchParams = Record<string, string | undefined>;

// 現在地の前後に何ページ分の番号を出すか。
// スマートフォンの幅（375px）で1行に収まる範囲として1を選んでいる
// （最大表示数は 先頭 + … + 前 + 現在 + 次 + … + 末尾 = 7項目）。
const SIBLING_COUNT = 1;

function buildPageNumbers(
  current: number,
  total: number,
): Array<number | "gap"> {
  const pages = new Set<number>([1, total]);
  for (let i = current - SIBLING_COUNT; i <= current + SIBLING_COUNT; i += 1) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  let previous: number | undefined;
  for (const page of sorted) {
    if (previous !== undefined && page - previous > 1) result.push("gap");
    result.push(page);
    previous = page;
  }
  return result;
}

function hrefForPage(
  basePath: string,
  params: SearchParams,
  page: number,
): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  // 1ページ目は page パラメータを付けない。
  // 同じ内容に ?page=1 付き / 無しの2つのURLができると、検索エンジンに重複と見なされるため。
  if (page > 1) next.set("page", String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

const ITEM_CLASSES =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm transition-colors";

export function Pagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: SearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const items = buildPageNumbers(page, totalPages);

  return (
    <nav aria-label="ページ送り" className="mt-8">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>
          {page > 1 ? (
            <Link
              href={hrefForPage(basePath, params, page - 1)}
              rel="prev"
              className={`${ITEM_CLASSES} text-charcoal-900 hover:border-primary-400 hover:bg-primary-50 border-neutral-300`}
            >
              前へ
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${ITEM_CLASSES} border-neutral-200 text-neutral-300`}
            >
              前へ
            </span>
          )}
        </li>

        {items.map((item, index) =>
          item === "gap" ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="text-foreground-muted px-1 text-sm"
            >
              …
            </li>
          ) : (
            <li key={item}>
              {item === page ? (
                <span
                  aria-current="page"
                  className={`${ITEM_CLASSES} border-primary-700 bg-primary-700 font-bold text-white`}
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={hrefForPage(basePath, params, item)}
                  aria-label={`${item}ページ目`}
                  className={`${ITEM_CLASSES} text-charcoal-900 hover:border-primary-400 hover:bg-primary-50 border-neutral-300`}
                >
                  {item}
                </Link>
              )}
            </li>
          ),
        )}

        <li>
          {page < totalPages ? (
            <Link
              href={hrefForPage(basePath, params, page + 1)}
              rel="next"
              className={`${ITEM_CLASSES} text-charcoal-900 hover:border-primary-400 hover:bg-primary-50 border-neutral-300`}
            >
              次へ
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className={`${ITEM_CLASSES} border-neutral-200 text-neutral-300`}
            >
              次へ
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
