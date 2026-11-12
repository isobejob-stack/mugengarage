import { describe, expect, it } from "vitest";
import {
  buildFaqGroups,
  faqAnswerKey,
  faqQuestionKey,
  resolveFaqItems,
} from "@/lib/seo/faq";
import {
  encyclopediaPageTitle,
  libraryPageTitle,
} from "@/lib/seo/search-terms";
import {
  BUSINESS_AREA_SERVED,
  BUSINESS_SERVICES,
  buildBusinessGraph,
} from "@/lib/seo/business";
import {
  buildFaqPageStructuredData,
  buildServiceStructuredData,
} from "@/lib/seo/structured-data";
import { plainTextFromMarkdown, excerptFromMarkdown } from "@/lib/seo/metadata";
import { buildLlmsTxt } from "@/lib/seo/llms";
import type { SiteSettings } from "@/lib/settings/queries";

// 検索のされ方ごとの受け皿（2026-11-12）。
// 「ジャガー 修理」「ジャガー 故障」「ジャガー 東京」「ディムラー ジャガー 違い」「ジャガー eタイプ」のような
// 検索に、どのページ・どの構造化データで答えるかを固定する（docs/tasks/SEO_KEYWORDS_2026-11-12.md）。

const SETTINGS: SiteSettings = {
  postal_code: "216-0011",
  address: "神奈川県川崎市宮前区初山1-3-2",
  phone: "090-2324-9333",
  business_hours: "11:00〜19:00",
  closed_days: "土曜日",
  founded_year: null,
  representative_name: null,
  access_info: null,
  email: null,
  external_links: [
    {
      label: "Instagram",
      url: "https://www.instagram.com/mgarage9333/",
      description: null,
    },
  ],
  hero_image_path: null,
};

describe("ページタイトルを探される言葉に寄せる", () => {
  it("図鑑の車名の前に「ジャガー」を付ける（「ジャガー eタイプ」で探されるため）", () => {
    expect(encyclopediaPageTitle("Eタイプ")).toBe(
      "ジャガー Eタイプ｜ジャガー図鑑",
    );
    expect(encyclopediaPageTitle("XJ40")).toBe("ジャガー XJ40｜ジャガー図鑑");
  });

  it("メーカー名がすでに入っている項目・ディムラーの車には付けない", () => {
    expect(encyclopediaPageTitle("ジャガー")).toBe("ジャガー｜ジャガー図鑑");
    expect(encyclopediaPageTitle("Jaguar XK120")).toBe(
      "Jaguar XK120｜ジャガー図鑑",
    );
    expect(encyclopediaPageTitle("ディムラー ダブルシックス")).toBe(
      "ディムラー ダブルシックス｜ジャガー図鑑",
    );
    expect(encyclopediaPageTitle("ダブルシックス")).toBe(
      "ダブルシックス｜ジャガー図鑑",
    );
  });

  it("用語は「〇〇とは」の形にする", () => {
    expect(libraryPageTitle("SUキャブレター")).toBe(
      "SUキャブレターとは｜ジャガー用語ライブラリ",
    );
    expect(libraryPageTitle("マッチングナンバーとは")).toBe(
      "マッチングナンバーとは｜ジャガー用語ライブラリ",
    );
  });
});

describe("店の構造化データ: 地域と取り扱い内容", () => {
  it("相手にしている地域（神奈川県・東京都）と、販売・整備修理・買取を示す", () => {
    const graph = buildBusinessGraph({
      settings: SETTINGS,
      heroImageUrl: null,
    });
    const business = graph["@graph"][0] as Record<string, unknown>;

    expect(business.areaServed).toEqual(
      BUSINESS_AREA_SERVED.map((name) => ({
        "@type": "AdministrativeArea",
        name,
      })),
    );
    expect(BUSINESS_AREA_SERVED).toContain("東京都");

    const catalog = business.hasOfferCatalog as {
      itemListElement: Array<{
        itemOffered: { name: string; url: string };
      }>;
    };
    const names = catalog.itemListElement.map((o) => o.itemOffered.name);
    expect(names).toEqual(BUSINESS_SERVICES.map((s) => s.name));
    expect(names.some((n) => n.includes("整備・修理"))).toBe(true);
    expect(names.some((n) => n.includes("買取"))).toBe(true);
    expect(
      catalog.itemListElement.find((o) => o.itemOffered.name.includes("修理"))
        ?.itemOffered.url,
    ).toBe("https://mugengarage.vercel.app/repair");
  });

  it("整備・修理のページは、全ページ共通の事業者を提供者とする Service として出す", () => {
    const data = buildServiceStructuredData({
      name: "ジャガー・ディムラーの整備・修理",
      serviceType: "自動車の整備・修理",
      description: "説明",
      url: "https://mugengarage.vercel.app/repair",
      areaServed: BUSINESS_AREA_SERVED,
      brands: ["Jaguar（ジャガー）"],
    });
    expect(data["@type"]).toBe("Service");
    expect((data.provider as { "@id": string })["@id"]).toBe(
      "https://mugengarage.vercel.app/#business",
    );
    expect(data.areaServed).toHaveLength(BUSINESS_AREA_SERVED.length);
  });
});

describe("よくある質問", () => {
  const stock = [
    { model_year: 1983 },
    { model_year: 2008 },
    { model_year: null },
  ];

  it("住所・営業時間・在庫の台数は店舗情報と在庫から差し込み、値をコードに持たない", () => {
    const groups = buildFaqGroups({ settings: SETTINGS, stock });
    const items = groups.flatMap((g) => g.items);

    const where = items.find((i) => i.key === "shop.where");
    expect(where?.facts).toEqual([
      "所在地: 〒216-0011 神奈川県川崎市宮前区初山1-3-2",
    ]);
    const visit = items.find((i) => i.key === "shop.visit");
    expect(visit?.facts).toEqual(["営業時間: 11:00〜19:00", "定休日: 土曜日"]);
    const lineup = items.find((i) => i.key === "buy.lineup");
    expect(lineup?.facts).toEqual([
      "いま掲載中の在庫は3台（1983〜2008年式）です。",
    ]);
  });

  it("未入力の店舗情報は差し込まない。在庫が無ければ台数も出さない", () => {
    const groups = buildFaqGroups({
      settings: {
        ...SETTINGS,
        address: null,
        business_hours: null,
        closed_days: null,
        phone: null,
      },
      stock: [],
    });
    const items = groups.flatMap((g) => g.items);
    expect(items.every((i) => i.facts.length === 0)).toBe(true);
  });

  it("Instagramが無いときは、Instagramを案内しない", () => {
    const groups = buildFaqGroups({
      settings: { ...SETTINGS, external_links: [] },
      stock,
    });
    const answers = groups.flatMap((g) => g.items).map((i) => i.answer);
    expect(answers.join("")).not.toContain("Instagram");
  });

  it("地域・ディムラー・故障・他店購入車の修理・買取の問いに答える", () => {
    const groups = buildFaqGroups({ settings: SETTINGS, stock });
    const questions = groups.flatMap((g) => g.items).map((i) => i.question);
    expect(questions).toEqual(
      expect.arrayContaining([
        "東京都や横浜市からも行けますか？",
        "ディムラー（デイムラー）とジャガーは何が違うのですか？",
        "ジャガーの旧車は壊れやすいですか？",
        "他店で購入したジャガーの整備・修理も頼めますか？",
        "ジャガー・ディムラーの買取もしていますか？",
      ]),
    );
  });

  it("ライブ編集のキーは問いごとに重ならない", () => {
    const groups = buildFaqGroups({ settings: SETTINGS, stock });
    const keys = groups
      .flatMap((g) => g.items)
      .flatMap((i) => [faqQuestionKey(i), faqAnswerKey(i)]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("構造化データには、店主が直した文章と差し込んだ事実を、記号を落として渡す", () => {
    const groups = buildFaqGroups({ settings: SETTINGS, stock });
    const texts = new Map([
      ["faq.shop.where.q", "お店の場所は？"],
      ["faq.shop.where.a", "**川崎市**と南足柄市です。"],
    ]);
    const resolved = resolveFaqItems(groups, texts);
    const where = resolved.find((i) => i.question === "お店の場所は？");
    expect(where?.answer).toBe(
      "川崎市と南足柄市です。 所在地: 〒216-0011 神奈川県川崎市宮前区初山1-3-2",
    );

    const data = buildFaqPageStructuredData({
      url: "https://mugengarage.vercel.app/faq",
      items: resolved,
    });
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(resolved.length);
    expect(data.mainEntity[0]).toMatchObject({
      "@type": "Question",
      acceptedAnswer: { "@type": "Answer" },
    });
  });
});

describe("Markdownの平文化", () => {
  it("記号と区切り線を落とし、切り詰めない", () => {
    const text = `### 見出し\n\n**太字**と[リンク](/x)。\n\n---\n\n- 箇条書き`;
    expect(plainTextFromMarkdown(text)).toBe("見出し 太字とリンク。 箇条書き");
  });

  it("抜粋は従来どおり指定の字数で切る", () => {
    expect(excerptFromMarkdown("あいうえお", 3)).toBe("あいう…");
  });
});

describe("llms.txt に整備・修理とよくある質問を載せる", () => {
  it("取り扱い内容・対応地域・新しいページ・よくある質問を載せる", () => {
    const faq = resolveFaqItems(
      buildFaqGroups({ settings: SETTINGS, stock: [] }),
      new Map(),
    );
    const text = buildLlmsTxt({
      settings: SETTINGS,
      vehicles: [],
      generatedAt: new Date("2026-11-12T03:00:00Z"),
      faq,
    });

    expect(text).toContain("## 取り扱い内容");
    expect(text).toContain(
      "[ジャガー・ディムラーの整備・修理](https://mugengarage.vercel.app/repair)",
    );
    expect(text).toContain("- 対応地域: 神奈川県・東京都");
    expect(text).toContain("https://mugengarage.vercel.app/repair/troubles");
    expect(text).toContain("https://mugengarage.vercel.app/faq");
    expect(text).toContain("## よくある質問");
    expect(text).toContain(
      "### ディムラー（デイムラー）とジャガーは何が違うのですか？",
    );
  });
});
