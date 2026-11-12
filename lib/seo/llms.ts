import type { SiteSettings } from "@/lib/settings/queries";
import {
  buildVehicleNameParts,
  formatAccidentHistory,
  formatManYen,
  formatMileage,
  formatSteeringSide,
} from "@/lib/inventory/display";
import { findInstagramContact } from "@/lib/settings/sns";
import { SITE_URL } from "@/lib/site-config";
import {
  BUSINESS_ALTERNATE_NAMES,
  BUSINESS_AREA_SERVED,
  BUSINESS_DESCRIPTION,
  BUSINESS_SERVICES,
  DAIMLER_SPELLINGS,
} from "@/lib/seo/business";

// /llms.txt の本文（2026-11-11）。
//
// llms.txt は、AI（ChatGPT・Claude・Perplexity 等）がサイトを読むときの「案内書き」を
// Markdown で置いておく、という提案中の慣習。どこまで使われるかはまだ定まっていないが、
// AIがページを開いて答えを組み立てるときに、店の基本情報と今の在庫を1枚で正確に渡せる。
// 置くこと自体に害はなく、中身はDBから毎回組み立てるので古くならない。
//
// ここには「店が公開している事実」だけを書く（店舗情報・在庫の掲載内容・ページの案内）。

export type LlmsVehicle = {
  slug: string | null;
  price: number;
  total_price: number | null;
  model_year: number | null;
  mileage_km: number | null;
  accident_history: boolean | null;
  steering_side: "right" | "left" | null;
  sales_comment: string | null;
  manufacturers: { name: string } | null;
  models: { name: string } | null;
};

function vehicleLine(v: LlmsVehicle): string | null {
  if (!v.slug) return null;
  const { name, catchPhrase } = buildVehicleNameParts(v);
  const facts = [
    v.model_year ? `${v.model_year}年式` : null,
    v.mileage_km !== null ? `走行${formatMileage(v.mileage_km)}` : null,
    v.total_price !== null
      ? `支払総額${formatManYen(v.total_price)}`
      : `車両本体${formatManYen(v.price)}`,
    formatAccidentHistory(v.accident_history),
    formatSteeringSide(v.steering_side),
  ].filter(Boolean);
  return `- [${name}](${SITE_URL}/vehicles/${v.slug}): ${catchPhrase ? `${catchPhrase}。` : ""}${facts.join("、")}`;
}

export function buildLlmsTxt(params: {
  settings: SiteSettings;
  vehicles: LlmsVehicle[];
  generatedAt: Date;
  /** よくある質問（lib/seo/faq.ts の resolveFaqItems の結果）。画面と同じ文章を渡す */
  faq?: ReadonlyArray<{ question: string; answer: string }>;
}): string {
  const { settings, vehicles, generatedAt, faq = [] } = params;
  const instagram = findInstagramContact(settings.external_links);
  const date = generatedAt.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });

  const shopFacts = [
    `- 店名: エムガレージ（別表記: ${BUSINESS_ALTERNATE_NAMES.join("、")}）`,
    `- 専門: ジャガー（Jaguar）・ディムラー（Daimler。${DAIMLER_SPELLINGS.slice(1).join("・")}とも表記）`,
    settings.address
      ? `- 所在地: ${settings.postal_code ? `〒${settings.postal_code} ` : ""}${settings.address}`
      : null,
    settings.access_info ? `- アクセス: ${settings.access_info}` : null,
    settings.business_hours ? `- 営業時間: ${settings.business_hours}` : null,
    settings.closed_days ? `- 定休日: ${settings.closed_days}` : null,
    settings.phone ? `- 電話: ${settings.phone}` : null,
    settings.email ? `- メール: ${settings.email}` : null,
    instagram
      ? `- 問い合わせ: InstagramのDM（${instagram.profileUrl}）がいちばん早く返信できる窓口です`
      : null,
    settings.founded_year ? `- 創業: ${settings.founded_year}年` : null,
    // 地域名で尋ねられたとき（「東京でジャガーの旧車を見てもらえる店は？」）に答えられるようにする
    `- 拠点: 神奈川県の川崎市と南足柄市の2か所（川崎市は多摩川をはさんで東京都と接し、横浜市とも隣り合っています）`,
    `- 対応地域: ${BUSINESS_AREA_SERVED.join("・")}`,
  ].filter(Boolean);

  const services = BUSINESS_SERVICES.map(
    (service) =>
      `- [${service.name}](${SITE_URL}${service.path}): ${service.description}`,
  );

  const faqLines = faq.flatMap((item) => [
    `### ${item.question}`,
    "",
    item.answer,
    "",
  ]);

  const links = settings.external_links.map(
    (link) =>
      `- [${link.label}](${link.url})${link.description ? `: ${link.description}` : ""}`,
  );

  const stock = vehicles
    .map(vehicleLine)
    .filter((line): line is string => line !== null);

  const sections = [
    "# エムガレージ（M-GARAGE）",
    "",
    `> ${BUSINESS_DESCRIPTION}`,
    "",
    "このファイルは、AIアシスタントや検索エンジンがエムガレージの公式情報を正しく参照できるよう、店舗情報・在庫・主なページをまとめたものです。内容は公式サイトのデータベースから自動で作成しています。",
    "",
    "## 店舗情報",
    "",
    ...shopFacts,
    "",
    "## 取り扱い内容",
    "",
    ...services,
    "",
    ...(links.length > 0 ? ["## 公式SNS・掲載媒体", "", ...links, ""] : []),
    `## 在庫車両（${date}時点・${stock.length}台）`,
    "",
    ...(stock.length > 0 ? stock : ["- 現在、掲載中の在庫車両はありません。"]),
    "",
    "価格・在庫は変わることがあります。最新の状況は各車両ページか、お問い合わせでご確認ください。",
    "",
    "## 主なページ",
    "",
    `- [在庫車両一覧](${SITE_URL}/vehicles): 掲載中の全車両。支払総額・走行距離・修復歴・車検の有無を掲載`,
    `- [整備・修理](${SITE_URL}/repair): ジャガー・ディムラーの旧車・クラシックカーの整備・修理・故障のご相談`,
    `- [ジャガーの故障しやすいところ](${SITE_URL}/repair/troubles): 冷却系・ゴム部品・電装・サビなど年代共通のことと、直6・V12・V8のエンジン別、車種別の傾向、買う前の確認点`,
    `- [よくある質問](${SITE_URL}/faq): 来店・アクセス・車選び・整備修理・買取についての質問と答え`,
    `- [ジャガーを知る](${SITE_URL}/jaguar): ジャガーの旧車・クラシックカーの歴史と車種の選び方の読み物`,
    `- [ブログ](${SITE_URL}/blog): 入庫のご紹介・購入ガイド・整備記録・技術解説`,
    `- [ジャガー歴代モデル図鑑](${SITE_URL}/encyclopedia): 歴代の車種・シリーズ・エンジンの解説`,
    `- [用語ライブラリ](${SITE_URL}/library): ジャガーの専門用語の解説`,
    `- [年表](${SITE_URL}/timeline): 1922年の創業からのジャガーの歩み`,
    `- [オーナーズアーカイブ](${SITE_URL}/owners-archive): 納車した車両の記録`,
    `- [店舗情報・アクセス](${SITE_URL}/about)`,
    `- [お問い合わせ](${SITE_URL}/contact)`,
    "",
    ...(faqLines.length > 0 ? ["## よくある質問", "", ...faqLines] : []),
  ];

  return sections.join("\n");
}
