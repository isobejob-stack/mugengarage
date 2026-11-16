import { describe, expect, it } from "vitest";
import { buildCustomRoute } from "next/dist/lib/build-custom-route";
import { formatUrl } from "next/dist/shared/lib/router/utils/format-url";
import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import {
  matchHas,
  prepareDestination,
} from "next/dist/shared/lib/router/utils/prepare-destination";
import {
  buildLegacyHostRedirects,
  LEGACY_PRODUCTION_HOST,
} from "@/lib/seo/legacy-host";

// 旧URL（mugengarage.vercel.app）→ 独自ドメインの恒久転送（lib/seo/legacy-host.ts、ISSUE-003）。
//
// 間違えると「サイトに誰も入れない（転送ループ）」「定期処理が止まる」「検索の評価が引き継がれない」
// のどれかになり、しかも本番で独自ドメインに切り替えた瞬間にしか表に出ない。
// そのため、ルールの中身だけでなく、Next.js 自身の照合（ビルド時に作られる正規表現と転送先の組み立て）に
// 通して、実際にどこへ転送されるかまで確かめる。

const NEW_SITE = "https://m-garage.jp";

// Next.js が next.config.ts の redirects を照合するのと同じ手順で、転送先を求める。
// 転送しない場合は null
function resolve(
  siteUrl: string | undefined,
  request: { host: string; path: string; query?: Record<string, string> },
): string | null {
  for (const route of buildLegacyHostRedirects(siteUrl)) {
    // ビルド時に作られ、Vercel の転送で使われる正規表現（_next 配下は除外される）
    const { regex } = buildCustomRoute("redirect", route, ["/_next"]);
    if (!new RegExp(regex).test(request.path)) continue;

    const params = getPathMatch(route.source, {
      removeUnnamedParams: true,
      strict: true,
    })(request.path);
    if (!params) continue;

    const query = request.query ?? {};
    const hasParams = matchHas(
      { headers: { host: request.host } } as never,
      query,
      route.has,
    );
    if (!hasParams) continue;

    // Next.js のサーバーが転送先URLを組み立てるのと同じ手順（server/lib/router-utils/resolve-routes.js）
    const { parsedDestination } = prepareDestination({
      appendParamsToQuery: false,
      destination: route.destination,
      params: { ...params, ...hasParams },
      query,
    });
    const search = new URLSearchParams(
      parsedDestination.query as Record<string, string>,
    ).toString();
    return formatUrl({
      ...parsedDestination,
      query: undefined,
      search: search ? `?${search}` : "",
    });
  }
  return null;
}

describe("buildLegacyHostRedirects", () => {
  it("移行前（未設定・旧URLのまま）は転送を足さない。足すと旧URLが自分自身へ転送されてループする", () => {
    expect(buildLegacyHostRedirects(undefined)).toEqual([]);
    expect(buildLegacyHostRedirects("")).toEqual([]);
    expect(
      buildLegacyHostRedirects(`https://${LEGACY_PRODUCTION_HOST}`),
    ).toEqual([]);
    expect(
      buildLegacyHostRedirects(`https://${LEGACY_PRODUCTION_HOST}/`),
    ).toEqual([]);
  });

  it("不正な値でもビルドを止めず、転送を足さない", () => {
    expect(buildLegacyHostRedirects("m-garage.jp")).toEqual([]);
  });

  it("恒久転送（検索エンジンが評価を引き継ぐ種類）にする", () => {
    const [route] = buildLegacyHostRedirects(NEW_SITE);
    expect(route.permanent).toBe(true);
    expect(buildCustomRoute("redirect", route, ["/_next"]).statusCode).toBe(
      308,
    );
  });
});

describe("移行後の旧URLへのアクセス", () => {
  it("トップは新しいドメインのトップへ", () => {
    expect(resolve(NEW_SITE, { host: LEGACY_PRODUCTION_HOST, path: "/" })).toBe(
      `${NEW_SITE}/`,
    );
  });

  it("各ページは同じパスのまま新しいドメインへ（日本語のslugも崩さない）", () => {
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/vehicles/double-six-1990",
      }),
    ).toBe(`${NEW_SITE}/vehicles/double-six-1990`);
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/encyclopedia/%E3%83%80%E3%83%96%E3%83%AB%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9",
      }),
    ).toBe(
      `${NEW_SITE}/encyclopedia/%E3%83%80%E3%83%96%E3%83%AB%E3%82%B7%E3%83%83%E3%82%AF%E3%82%B9`,
    );
    expect(
      resolve(NEW_SITE, { host: LEGACY_PRODUCTION_HOST, path: "/sitemap.xml" }),
    ).toBe(`${NEW_SITE}/sitemap.xml`);
  });

  it("絞り込みなどのクエリも引き継ぐ", () => {
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/vehicles",
        query: { model: "xj6" },
      }),
    ).toBe(`${NEW_SITE}/vehicles?model=xj6`);
  });

  it("新しいドメインの末尾に / があっても、転送先が // にならない", () => {
    expect(
      resolve(`${NEW_SITE}/`, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/blog",
      }),
    ).toBe(`${NEW_SITE}/blog`);
  });

  it("/api は転送しない（Vercel の定期処理は転送をたどらず、そこで止まるため）", () => {
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/api/cron/publish-scheduled",
      }),
    ).toBeNull();
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/api/auth/callback",
      }),
    ).toBeNull();
  });

  it("/api で始まるだけの別のページ（/apisode のような）は転送する", () => {
    expect(
      resolve(NEW_SITE, { host: LEGACY_PRODUCTION_HOST, path: "/apisode" }),
    ).toBe(`${NEW_SITE}/apisode`);
  });

  it("Search Console の確認ファイルは転送しない（旧URLの所有権の確認を通し続けるため）", () => {
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/googlec78f865b23466e93.html",
      }),
    ).toBeNull();
    // 似た名前のページまで巻き込まない
    expect(
      resolve(NEW_SITE, {
        host: LEGACY_PRODUCTION_HOST,
        path: "/googlec78f865b23466e93.html/x",
      }),
    ).toBe(`${NEW_SITE}/googlec78f865b23466e93.html/x`);
    expect(
      resolve(NEW_SITE, { host: LEGACY_PRODUCTION_HOST, path: "/google" }),
    ).toBe(`${NEW_SITE}/google`);
  });
});

describe("旧URL以外へのアクセスは転送しない", () => {
  it("新しいドメイン自身（転送するとループする）", () => {
    expect(resolve(NEW_SITE, { host: "m-garage.jp", path: "/" })).toBeNull();
  });

  it("プレビュー（ブランチごとの確認用URL）は旧URLに似ていても転送しない", () => {
    expect(
      resolve(NEW_SITE, {
        host: "mugengarage-git-feature-x-isobejob.vercel.app",
        path: "/",
      }),
    ).toBeNull();
    // 「.」を任意の1文字として扱っていると、これに一致してしまう
    expect(
      resolve(NEW_SITE, { host: "mugengaragexvercelxapp", path: "/" }),
    ).toBeNull();
  });

  it("手元の開発環境（localhost）", () => {
    expect(resolve(NEW_SITE, { host: "localhost:3000", path: "/" })).toBeNull();
  });
});
