import type { Vehicle } from "@/lib/inventory/types";
import {
  buildVehicleName,
  buildVehicleNameParts,
  formatAccidentHistory,
  formatManYen,
  formatMileage,
  formatShaken,
  formatSteeringSide,
  stripListingHeadline,
} from "@/lib/inventory/display";
import { excerptFromMarkdown } from "@/lib/seo/metadata";
import { BUSINESS_AREA, BUSINESS_SPECIALTY } from "@/lib/seo/business";

type VehicleForMeta = Pick<
  Vehicle,
  | "model_year"
  | "mileage_km"
  | "price"
  | "total_price"
  | "accident_history"
  | "steering_side"
  | "shaken_status"
  | "shaken_expiry"
  | "sales_comment"
> & {
  manufacturers: { name: string } | null;
  models: { name: string } | null;
};

// 車両ページの車名: 「ディムラー ダブルシックス（1990年式）」。見出し・パンくず・写真の説明・構造化データに使う。
// 車名はグレードまでにとどめ、売り文句（「特注ワイヤーホイール」等）は本文と説明文に回す
// （lib/inventory/display.ts の buildVehicleNameParts）。
export function buildVehiclePageTitle(vehicle: VehicleForMeta): string {
  const name = buildVehicleName(vehicle);
  return vehicle.model_year ? `${name}（${vehicle.model_year}年式）` : name;
}

// 検索結果に出るタイトル（<title>）: 「ディムラー ダブルシックス（1990年式）の中古車」（2026-11-12）。
// 「ダブルシックス 中古」「XJ6 中古車」のように車名と「中古」で探されるため、末尾に「の中古車」を付ける。
// 見出しには付けない（ページの中で車名の後ろに「の中古車」と出るのは読みにくい）。
// 店名（｜エムガレージ）はルートlayoutの title.template が付ける。
export function buildVehicleDocumentTitle(vehicle: VehicleForMeta): string {
  return `${buildVehiclePageTitle(vehicle)}の中古車`;
}

// 車両ページの説明文（検索結果の説明・AIの回答の材料）。
//
// 以前は販売コメントをそのまま使っており、取り込んだ車両では
// 「**XJ6-3.2 ワンオーナー車、**」という Markdown の記号付きの見出しから始まっていた。
// 探す人が検索結果で比べたいのは、年式・走行距離・支払総額・修復歴・ハンドル位置・車検なので、
// それを先頭に並べ、残りの字数で販売コメントの冒頭を添える。どの店の車かも最後に入れる。
export function buildVehicleMetaDescription(vehicle: VehicleForMeta): string {
  const { name, catchPhrase } = buildVehicleNameParts(vehicle);
  const facts = [
    vehicle.mileage_km !== null
      ? `走行${formatMileage(vehicle.mileage_km)}`
      : null,
    vehicle.total_price !== null
      ? `支払総額${formatManYen(vehicle.total_price)}（車両本体${formatManYen(vehicle.price)}）`
      : `車両本体${formatManYen(vehicle.price)}`,
    formatAccidentHistory(vehicle.accident_history),
    formatSteeringSide(vehicle.steering_side),
    formatShaken(vehicle.shaken_status, vehicle.shaken_expiry),
  ].filter(Boolean);

  // 売り文句（「特注ワイヤーホイール」等）はタイトルから外したぶん、説明文の頭に入れる
  const lead = `${vehicle.model_year ? `${vehicle.model_year}年式 ` : ""}${name}。${catchPhrase ? `${catchPhrase}。` : ""}${facts.join("・")}。`;
  const shop = `${BUSINESS_AREA}の${BUSINESS_SPECIALTY}エムガレージの在庫車両です。`;

  // 説明文は120字前後で切られるため、販売コメントは残りの字数ぶんだけ入れる
  const room = 150 - lead.length - shop.length;
  const comment =
    room > 20
      ? excerptFromMarkdown(stripListingHeadline(vehicle.sales_comment), room)
      : "";

  return [lead, comment, shop].filter(Boolean).join("");
}

// 在庫一覧の説明文。いま並んでいる在庫から「何台・どの車種・何年式」を書く。
// 車種は台数の多い順に4つまで（多すぎると説明文が車種名の羅列になるため）。
export function buildVehicleListDescription(
  stock: Array<{ model_year: number | null; models: { name: string } | null }>,
): string {
  const shop = `エムガレージ（${BUSINESS_AREA}）の${BUSINESS_SPECIALTY}`;
  if (stock.length === 0) {
    return `${shop}の在庫車両一覧です。XJ6・XJ-S・ダブルシックスなど英国の旧車を、支払総額・走行距離・修復歴まで掲載しています。`;
  }

  const counts = new Map<string, number>();
  for (const v of stock) {
    const name = v.models?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const topModels = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  const years = stock
    .map((v) => v.model_year)
    .filter((y): y is number => y !== null);
  const yearRange =
    years.length > 0
      ? Math.min(...years) === Math.max(...years)
        ? `${Math.min(...years)}年式の`
        : `${Math.min(...years)}〜${Math.max(...years)}年式の`
      : "";

  return `${shop}の在庫車両${stock.length}台。${topModels.length > 0 ? `${topModels.join("・")}など、` : ""}${yearRange}英国車を支払総額・走行距離・修復歴まで掲載しています。`;
}
