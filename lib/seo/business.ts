import type { SiteSettings } from "@/lib/settings/queries";
import { SITE_NAME, SITE_URL } from "@/lib/site-config";

// 検索エンジンとAI検索に「この店は何者か」を1つの実体として伝えるための情報（2026-11-11）。
//
// 背景: 「エムガレージ」で調べると、AIの回答は車選びドットコム・グーネットの掲載情報だけを
// 根拠にしており、「店舗の公式サイトは確認できませんでした」と答えていた。
// 掲載媒体ごとに電話番号も違う（グーネットは転送番号）ため、どれが正しい店の情報かを
// 機械が判断できない。公式サイトが「この店の情報の出どころ」だと分かるよう、
// 店名・別名・住所・営業時間・公式SNS・掲載媒体を1つの実体（@id）にまとめて全ページで出す。
//
// 記事・図鑑の発行元や、在庫車両の売り手も同じ @id を指す。
// 「この記事を書いた店」と「この車を売っている店」と「神奈川（川崎市・南足柄市）の専門店」が
// 同一の事業者だと、ページをまたいで結び付けられるようにするため。

/** 事業者の実体を指すID。URLの形をしているが、ページではなく実体の識別子 */
export const BUSINESS_ID = `${SITE_URL}/#business`;
/** サイトを指すID */
export const WEBSITE_ID = `${SITE_URL}/#website`;

// 「エムガレージ」は表記の揺れが大きく、似た名前の店も多い（エムズガレージ、ガレージM 等）。
// 英字・中黒入りの表記で探す人もいるため、同じ店の別名として明示する。
export const BUSINESS_ALTERNATE_NAMES = [
  "M-GARAGE",
  "M GARAGE",
  "Mガレージ",
  "エム・ガレージ",
] as const;

// 専門分野の言い方。車選びドットコムの店名「エムガレージ【ジャガー、ディムラー専門店】」に揃える。
// 掲載媒体と公式サイトで店の名乗りが揃っていると、同じ店だと結び付けられやすい。
export const BUSINESS_SPECIALTY = "ジャガー・ディムラー専門店";

// 拠点のある地域。タイトルや説明文のように、店舗情報（DB）を読まずに組み立てる文言で使う。
// 拠点は神奈川県内の2か所（川崎市・南足柄市。2026-11-11 発注者の指示）。
// 拠点が変わったらここを直す（住所そのものは管理画面の店舗情報が正）。
export const BUSINESS_PREFECTURE = "神奈川県";
export const BUSINESS_CITIES = ["川崎市", "南足柄市"] as const;
/** 「神奈川県川崎市・南足柄市」 */
export const BUSINESS_AREA = `${BUSINESS_PREFECTURE}${BUSINESS_CITIES.join("・")}`;

// Daimler の片仮名は3通りに割れている。店の表記は「ディムラー」だが、
// グーネット・webCG・carview は「デイムラー」、他店や AI の回答には「ダイムラー」もある。
// 検索語はどれもありうるため、説明文などで一度ずつ触れて取りこぼさないようにする。
export const DAIMLER_SPELLINGS = [
  "ディムラー",
  "デイムラー",
  "ダイムラー",
] as const;

// 取り扱いの中心。車選びドットコムの店舗紹介
// 「XJ-6, XJ-S, ダブルシックス等の英国車の旧車を中心に販売中」に沿う。
export const BUSINESS_KNOWS_ABOUT = [
  "ジャガー",
  "ディムラー（デイムラー）",
  "ジャガー XJ",
  "XJ6",
  "XJ-S",
  "ダブルシックス",
  "ジャガーの旧車",
  "クラシックジャガー",
  "クラシックカー",
  "英国車",
  "ジャガーの整備・修理",
] as const;

// 店の紹介文（構造化データ・説明文・llms.txt で共通）。「デイムラー」は検索で最も多い表記のため括弧で添える。
// 探す人の言い方は「ジャガー 旧車」「ジャガー クラシックカー」「クラシックジャガー 専門店」と割れているため（2026-11-12）、
// 旧車・クラシックカーの両方を一度ずつ入れる
export const BUSINESS_DESCRIPTION = `${BUSINESS_AREA}のジャガー・ディムラー（デイムラー）専門店。XJ6・XJ-S・ダブルシックスなどジャガーの旧車・クラシックカーを中心に、30年以上の実績で販売・整備・修理・買取を行っています。`;

// お客様の来られる地域（構造化データの areaServed）。2026-11-12 追加。
//
// 「ジャガー 東京」「ジャガー 神奈川」のように地域名で探す人に対して、どこの人を相手にしている店かを示す。
// 川崎市は多摩川をはさんで東京都と接しているため、東京都も入れる。
// 地域ごとに中身の同じページ（/area/tokyo 等）を量産するのは、Google が「誘導ページ」として
// 順位を下げる対象にしているのでやらない。地域はこの一覧と、店舗情報・よくある質問の本文で伝える。
export const BUSINESS_AREA_SERVED = ["神奈川県", "東京都"] as const;

// 取り扱い内容（構造化データの hasOfferCatalog・llms.txt・各ページで共通）。2026-11-12 追加。
// 名前は探す人の言い方に合わせる（「ジャガー 修理」「ジャガー 整備」「ジャガー 買取」）。
// 車検はここに入れていない。店として受けているかを確かめてから足す（docs/tasks/SEO_KEYWORDS_2026-11-12.md）
export const BUSINESS_SERVICES = [
  {
    name: "ジャガー・ディムラーの中古車販売",
    description:
      "XJ6・XJ-S・ダブルシックスなど、ジャガー・ディムラーの旧車・クラシックカーの販売",
    path: "/vehicles",
  },
  {
    name: "ジャガー・ディムラーの整備・修理",
    description:
      "旧車・クラシックカーの定期的な整備、故障・不調の修理、レストアや部品のご相談",
    path: "/repair",
  },
  {
    name: "ジャガー・ディムラーの買取",
    description: "長く乗られたジャガー・ディムラーの買取・売却のご相談",
    path: "/about",
  },
] as const;

// ── 住所 ────────────────────────────────────────────────────────────────

export type ParsedAddress = {
  region: string | null;
  locality: string | null;
  street: string | null;
};

const PREFECTURE = "(東京都|北海道|(?:京都|大阪)府|[^\\s\\d]{2,3}県)";
// 政令指定都市の区（川崎市宮前区）→ 郡の町村 → 市区町村 の順に試す。
// 先に「◯◯市」だけで切ると「川崎市」「宮前区初山…」に分かれてしまうため。
const LOCALITY =
  "([^\\s\\d]+?市[^\\s\\d]+?区|[^\\s\\d]+?郡[^\\s\\d]+?[町村]|[^\\s\\d]+?[市区町村])";
const ADDRESS_PATTERN = new RegExp(`^${PREFECTURE}\\s*${LOCALITY}\\s*(.*)$`);

// 管理画面の「住所」は1つの欄に「神奈川県川崎市宮前区初山1-3-2」のように入っている。
// 構造化データでは都道府県・市区町村・それ以下を分けて渡すほうが正確に読まれるため、
// 都道府県と市区町村を切り出す。形が読めなければ全体を「それ以下」として返す（推測で分けない）。
export function parseJapaneseAddress(address: string): ParsedAddress {
  const normalized = address
    .replace(/^〒?\s*\d{3}-?\d{4}\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

  const match = normalized.match(ADDRESS_PATTERN);
  if (!match) {
    return { region: null, locality: null, street: normalized || null };
  }

  const [, region, locality, rest] = match;
  return { region, locality, street: rest.trim() || null };
}

// ── 営業時間 ────────────────────────────────────────────────────────────

const SCHEMA_DAYS = [
  ["月", "https://schema.org/Monday"],
  ["火", "https://schema.org/Tuesday"],
  ["水", "https://schema.org/Wednesday"],
  ["木", "https://schema.org/Thursday"],
  ["金", "https://schema.org/Friday"],
  ["土", "https://schema.org/Saturday"],
  ["日", "https://schema.org/Sunday"],
] as const;

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

function toHalfWidth(value: string): string {
  return value.replace(/[０-９：]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
}

function parseTime(hour: string, minute: string | undefined): string | null {
  const h = Number(hour);
  const m = minute === undefined ? 0 : Number(minute);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 24 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 「11:00〜19:00」「11時〜19時」「10:00-18:30」のような、1日1区間の書き方だけを読む。
// 「平日10時〜、土日は〜17時」のような複数区間・曜日別の書き方は読まない（null）。
// 読めない営業時間を推測で構造化データにすると、誤った営業時間が検索結果に出るため。
export function parseBusinessHours(
  text: string,
): { opens: string; closes: string } | null {
  const normalized = toHalfWidth(text).replace(/\s+/g, "");
  const match = normalized.match(
    /^(\d{1,2})(?::(\d{2})|時(?:(\d{2})分)?)[〜～~\-－ー–—](\d{1,2})(?::(\d{2})|時(?:(\d{2})分)?)$/,
  );
  if (!match) return null;

  const opens = parseTime(match[1], match[2] ?? match[3]);
  const closes = parseTime(match[4], match[5] ?? match[6]);
  if (!opens || !closes || opens >= closes) return null;
  return { opens, closes };
}

// 定休日の書き方から、休みの曜日を読む。読めなければ null。
// 「第2火曜」「隔週」「不定休」のように、曜日の一覧で表せない休みは読まない。
export function parseClosedWeekdays(text: string): Set<string> | null {
  const normalized = text.replace(/\s+/g, "");
  if (normalized === "") return null;
  if (/無休/.test(normalized)) return new Set();
  if (/第|隔週|不定|月末|月初|毎月|お盆|年末|年始|平日/.test(normalized)) {
    return null;
  }

  // 「土曜日」「祝日」の「日」を日曜日と取り違えないよう、先に祝日の語と「曜日」「曜」を落とす。
  // 祝日の休みは曜日で表せないため、ここでは数えない（呼び出し側のコメント参照）
  const days = normalized
    .replace(/祝祭日|祝日|祭日|祝/g, "")
    .replace(/曜日?/g, "");
  const closed = new Set<string>();
  for (const [kanji] of SCHEMA_DAYS) {
    if (days.includes(kanji)) closed.add(kanji);
  }
  return closed.size > 0 ? closed : null;
}

// 営業時間と定休日がどちらも読めたときだけ、曜日ごとの営業時間を組み立てる。
// 祝日の休みは曜日で表せないため含めない（祝日の扱いはGoogleビジネスプロフィール側で設定する）。
export function buildOpeningHoursSpecification(
  businessHours: string | null,
  closedDays: string | null,
): OpeningHoursSpecification[] | null {
  if (!businessHours || !closedDays) return null;
  const hours = parseBusinessHours(businessHours);
  const closed = parseClosedWeekdays(closedDays);
  if (!hours || !closed) return null;

  const openDays = SCHEMA_DAYS.filter(([kanji]) => !closed.has(kanji)).map(
    ([, uri]) => uri,
  );
  if (openDays.length === 0) return null;

  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: openDays,
      opens: hours.opens,
      closes: hours.closes,
    },
  ];
}

// ── 構造化データ ──────────────────────────────────────────────────────────

// 記事・図鑑の発行元や車両の売り手として、事業者の実体を指すときの短い形
export const businessReference = {
  "@type": "Organization",
  "@id": BUSINESS_ID,
  name: SITE_NAME,
  url: SITE_URL,
} as const;

// 全ページに出す、事業者とサイトの構造化データ（@graph）。
// 未入力の店舗情報は出さない。空や推測の値を出すと、誤った店舗情報を検索エンジンに渡してしまう。
export function buildBusinessGraph(params: {
  settings: SiteSettings;
  heroImageUrl: string | null;
}) {
  const { settings, heroImageUrl } = params;
  const address = settings.address
    ? parseJapaneseAddress(settings.address)
    : null;
  const openingHours = buildOpeningHoursSpecification(
    settings.business_hours,
    settings.closed_days,
  );
  const sameAs = settings.external_links
    .map((link) => link.url)
    .filter((url) => /^https:\/\//.test(url));

  const business: Record<string, unknown> = {
    // 販売店であり整備工場でもある（販売・整備・修理・買取）。
    // 「ジャガー 修理 川崎」「ジャガー 整備 南足柄」のような整備の検索でも同じ店として扱われるよう、両方の型を持たせる
    "@type": ["AutoDealer", "AutoRepair"],
    "@id": BUSINESS_ID,
    name: SITE_NAME,
    alternateName: [...BUSINESS_ALTERNATE_NAMES],
    url: SITE_URL,
    description: BUSINESS_DESCRIPTION,
    slogan: BUSINESS_SPECIALTY,
    knowsAbout: [...BUSINESS_KNOWS_ABOUT],
    brand: [
      { "@type": "Brand", name: "Jaguar（ジャガー）" },
      { "@type": "Brand", name: "Daimler（ディムラー／デイムラー）" },
    ],
    ...(heroImageUrl ? { image: heroImageUrl } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(address
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "JP",
            ...(settings.postal_code
              ? { postalCode: settings.postal_code }
              : {}),
            ...(address.region ? { addressRegion: address.region } : {}),
            ...(address.locality ? { addressLocality: address.locality } : {}),
            ...(address.street ? { streetAddress: address.street } : {}),
          },
          hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address ?? "")}`,
        }
      : {}),
    // 拠点は2か所（川崎市・南足柄市）。住所の欄（店舗情報）は1つなので、
    // 2か所の市をここで示し、どちらの地域で探した人にも同じ店だと分かるようにする
    location: BUSINESS_CITIES.map((city) => ({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "JP",
        addressRegion: BUSINESS_PREFECTURE,
        addressLocality: city,
      },
    })),
    ...(openingHours ? { openingHoursSpecification: openingHours } : {}),
    // 「ジャガー 東京」「ジャガー 神奈川」で探す人に、相手にしている地域を示す
    areaServed: BUSINESS_AREA_SERVED.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
    // 販売だけでなく整備・修理・買取もする店だと、検索エンジンとAIに分かるようにする
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "取り扱い内容",
      itemListElement: BUSINESS_SERVICES.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.description,
          url: `${SITE_URL}${service.path}`,
        },
      })),
    },
    ...(settings.founded_year
      ? { foundingDate: String(settings.founded_year) }
      : {}),
    // 公式SNSと掲載媒体の店舗ページ。同じ事業者のアカウントだと結び付けるための最重要項目
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    // Google はトップページの WebSite の name / alternateName を検索結果の「サイト名」に使う
    name: SITE_NAME,
    alternateName: [...BUSINESS_ALTERNATE_NAMES],
    url: `${SITE_URL}/`,
    inLanguage: "ja",
    publisher: { "@id": BUSINESS_ID },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [business, website],
  };
}
