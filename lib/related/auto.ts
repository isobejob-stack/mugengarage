import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// 車両と知識コンテンツ（図鑑・年表・ライブラリ・ブログ・整備実績）を自動で結びつける。
//
// 【なぜ必要か】
// 「この車をもっと知りたい」と思った人が、その車種の解説・歴史・整備実績へ
// 自然に進める状態を作るのが目的（回遊）。
//
// 【なぜ名前一致で判定するのか】
// encyclopedia_entries / articles / maintenance_records / timeline_events は
// いずれも model_id を持っていない。taggings も vehicle と article にしか対応しておらず、
// 現状「同じ車種の知識」を機械的に引く手段が構造的に存在しない。
// 唯一の仕組みである related_contents は手動指定のため、店主が1件ずつ紐付けない限り
// 関連が生まれず、実質機能していなかった。
//
// 各テーブルに model_id を足す案も検討したが、
// - 既存の100件超すべてに店主が手作業で車種を割り当てる必要が生じる
// - 図鑑・年表・ブログの見出しには実際に車種名が入っている
//   （「XJ6発表」「Eタイプ論」「XKエンジン物語」等）
// ことから、まずは名前一致で判定する。対象は全部で100件程度と小さく、
// 1リクエストで全件読んでメモリ上で突き合わせても負荷にならない。
//
// 精度が問題になった場合は、各テーブルに model_id（nullable）を足し、
// 初期値をこの名前一致で埋めたうえで管理画面から補正する形に移行できる。
// そのときも、この関数の呼び出し側（ページ）は変えずに済む。
//
// 【手動指定との関係】
// related_contents による手動指定は従来どおり優先する。
// 自動判定はあくまで「手動で紐付けていないものを補う」役割で、
// 手動で選ばれたものと重複する場合は自動側を落とす（呼び出し側で除外）。

export type AutoRelatedType =
  | "vehicle"
  | "encyclopedia_entry"
  | "timeline_event"
  | "library_entry"
  | "article"
  | "maintenance_record";

export type AutoRelatedItem = {
  type: AutoRelatedType;
  id: string;
  label: string;
  url: string;
  /** なぜ関連として出したのか（画面に出して納得感を持たせる） */
  reason: string;
};

/** 1種別あたりの最大表示件数。並べすぎると選べなくなるため絞る。 */
const PER_TYPE_LIMIT = 4;

// 車種名の表記ゆれを吸収する。
// 全角/半角・大文字小文字・スペース・ハイフンの有無を無視して比較する
// （「XJ-S」「XJS」「ＸＪＳ」を同じ語として扱うため）。
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\-–—・]/g, "");
}

/**
 * コンテンツのタイトルが車種名を含むか。含む場合ほど強い順に点数を返す。
 * 0 は非該当。
 *
 * 「XJ」は「XJ6」「XJ220」「XJR」にも当たるが、これらは実際に同系統の話題であり、
 * 関連として出す価値がある。逆に完全一致を要求すると、ほとんど何も引っかからない。
 */
function matchScore(title: string, keyword: string): number {
  const t = normalize(title);
  const k = normalize(keyword);
  if (k.length < 2) return 0; // 1文字の車種名は誤爆が大きいので対象外
  if (t === k) return 3;
  if (t.startsWith(k)) return 2;
  if (t.includes(k)) return 1;
  return 0;
}

type Row = { id: string; title: string; slug?: string | null };

// キーワード群（車種名・シリーズ名・世代名）でコンテンツを絞り、点数順に返す
function pickByKeywords(
  rows: Row[],
  keywords: string[],
  build: (row: Row) => { url: string; reason: string },
  type: AutoRelatedType,
): AutoRelatedItem[] {
  const scored = rows
    .map((row) => ({
      row,
      score: Math.max(...keywords.map((k) => matchScore(row.title, k)), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.row.title.localeCompare(b.row.title))
    .slice(0, PER_TYPE_LIMIT);

  return scored.map(({ row }) => {
    const { url, reason } = build(row);
    return { type, id: row.id, label: row.title, url, reason };
  });
}

export type VehicleRelationSource = {
  id: string;
  model_id: string | null;
  model_year: number | null;
  models: { name: string } | null;
  series?: { name: string } | null;
  generations?: { name: string } | null;
};

/**
 * 車両詳細ページ向けの自動関連。
 * 「同じ車種の在庫」と「この車種にまつわる読み物」を返す。
 */
export async function getAutoRelatedForVehicle(vehicle: VehicleRelationSource) {
  const keywords = [
    vehicle.models?.name,
    vehicle.series?.name,
    vehicle.generations?.name,
  ].filter((v): v is string => Boolean(v));

  if (keywords.length === 0) {
    return { similarVehicles: [], knowledge: [] as AutoRelatedItem[] };
  }

  const supabase = createAdminClient();

  const [
    { data: encyclopedia },
    { data: timeline },
    { data: library },
    { data: articles },
    { data: maintenance },
  ] = await Promise.all([
    supabase
      .from("encyclopedia_entries")
      .select("id, title, slug")
      .is("deleted_at", null),
    supabase
      .from("timeline_events")
      .select("id, title, event_date")
      .is("deleted_at", null),
    supabase
      .from("library_entries")
      .select("id, title, slug")
      .is("deleted_at", null),
    supabase
      .from("articles")
      .select("id, title, slug")
      .eq("status", "published")
      .is("deleted_at", null),
    supabase
      .from("maintenance_records")
      .select("id, title, slug")
      .is("deleted_at", null),
  ]);

  const modelName = vehicle.models?.name ?? "この車種";

  const knowledge = [
    ...pickByKeywords(
      (encyclopedia ?? []) as Row[],
      keywords,
      (r) => ({
        url: `/encyclopedia/${r.slug}`,
        reason: `${modelName}の解説`,
      }),
      "encyclopedia_entry",
    ),
    ...pickByKeywords(
      (timeline ?? []) as Row[],
      keywords,
      (r) => ({ url: `/timeline#event-${r.id}`, reason: `${modelName}の歴史` }),
      "timeline_event",
    ),
    ...pickByKeywords(
      (articles ?? []) as Row[],
      keywords,
      (r) => ({ url: `/blog/${r.slug}`, reason: "関連する読み物" }),
      "article",
    ),
    ...pickByKeywords(
      (maintenance ?? []) as Row[],
      keywords,
      (r) => ({ url: `/maintenance-records/${r.slug}`, reason: "整備の実例" }),
      "maintenance_record",
    ),
    ...pickByKeywords(
      (library ?? []) as Row[],
      keywords,
      (r) => ({ url: `/library/${r.slug}`, reason: "用語解説" }),
      "library_entry",
    ),
  ];

  const similarVehicles = await getSimilarVehicles(vehicle);

  return { similarVehicles, knowledge };
}

export type SimilarVehicle = {
  id: string;
  slug: string | null;
  name: string;
  price: number;
  total_price: number | null;
  model_year: number | null;
  mileage_km: number | null;
  shaken_status: string | null;
  shaken_expiry: string | null;
  accident_history: boolean | null;
  reason: string;
};

/**
 * 似ている在庫車両。
 * まず同じ車種、足りなければ近い年代（±7年）で補う。
 * 「他にどんな選択肢があるか」を示すのが目的なので、完全一致にこだわらない。
 */
export async function getSimilarVehicles(
  vehicle: VehicleRelationSource,
  limit = 4,
): Promise<SimilarVehicle[]> {
  const supabase = createAdminClient();

  const select =
    "id, price, total_price, model_year, mileage_km, shaken_status, shaken_expiry, accident_history, model_id, manufacturers(name), models(name), grades(name)";

  type VehicleRow = {
    id: string;
    price: number;
    total_price: number | null;
    model_year: number | null;
    mileage_km: number | null;
    shaken_status: string | null;
    shaken_expiry: string | null;
    accident_history: boolean | null;
    model_id: string | null;
    manufacturers: { name: string } | null;
    models: { name: string } | null;
    grades: { name: string } | null;
  };

  const collected = new Map<string, { row: VehicleRow; reason: string }>();

  const add = (rows: VehicleRow[] | null, reason: string) => {
    for (const row of rows ?? []) {
      if (row.id === vehicle.id) continue;
      if (collected.has(row.id)) continue;
      if (collected.size >= limit) break;
      collected.set(row.id, { row, reason });
    }
  };

  if (vehicle.model_id) {
    const { data } = await supabase
      .from("vehicles")
      .select(select)
      .eq("status", "published")
      .is("deleted_at", null)
      .eq("model_id", vehicle.model_id)
      .limit(limit + 1);
    add(data as unknown as VehicleRow[], "同じ車種");
  }

  if (collected.size < limit && vehicle.model_year !== null) {
    const { data } = await supabase
      .from("vehicles")
      .select(select)
      .eq("status", "published")
      .is("deleted_at", null)
      .gte("model_year", vehicle.model_year - 7)
      .lte("model_year", vehicle.model_year + 7)
      .limit(limit + 5);
    add(data as unknown as VehicleRow[], "近い年代");
  }

  const rows = Array.from(collected.values());
  if (rows.length === 0) return [];

  const { data: seoMetas } = await supabase
    .from("seo_metas")
    .select("target_id, slug")
    .eq("target_type", "vehicle")
    .in(
      "target_id",
      rows.map((r) => r.row.id),
    );
  const slugById = new Map((seoMetas ?? []).map((s) => [s.target_id, s.slug]));

  return rows.map(({ row, reason }) => ({
    id: row.id,
    slug: slugById.get(row.id) ?? null,
    name: [row.manufacturers?.name, row.models?.name, row.grades?.name]
      .filter(Boolean)
      .join(" "),
    price: row.price,
    total_price: row.total_price,
    model_year: row.model_year,
    mileage_km: row.mileage_km,
    shaken_status: row.shaken_status,
    shaken_expiry: row.shaken_expiry,
    accident_history: row.accident_history,
    reason,
  }));
}

/**
 * FR-ENC-005（未実装だった要件）: 図鑑・年表など知識ページから、
 * その話題に対応する在庫車両を引く。
 *
 * 「XJの解説を読んで興味を持った人が、その場でXJの在庫を見られる」という
 * 逆方向の導線。知識コンテンツは在庫に依存しない設計（FR-ENC-003）のままで、
 * 表示側だけで結びつける。
 */
export async function getVehiclesRelatedToTitle(
  title: string,
  limit = 4,
): Promise<{ modelName: string | null; vehicles: SimilarVehicle[] }> {
  const supabase = createAdminClient();

  const { data: models } = await supabase
    .from("models")
    .select("id, name")
    .is("deleted_at", null);

  // タイトルに含まれる車種名のうち、最も長く一致するものを採用する。
  // 「XK120」の記事で車種「XK」と「XK120」の両方が当たった場合、
  // より具体的な「XK120」を選ぶ。
  const matched = (models ?? [])
    .filter((m) => matchScore(title, m.name as string) > 0)
    .sort((a, b) => String(b.name).length - String(a.name).length)[0] as
    { id: string; name: string } | undefined;

  if (!matched) return { modelName: null, vehicles: [] };

  // 見出しには記事タイトルではなく、一致した車種名を使う。
  // ブログ記事「なぜEタイプは最も美しい車と呼ばれるのか」に対して
  // 「なぜEタイプは…の在庫車両」という見出しになるのを避けるため。
  const vehicles = await getSimilarVehicles(
    {
      id: "",
      model_id: matched.id,
      model_year: null,
      models: { name: matched.name },
    },
    limit,
  );

  return { modelName: matched.name, vehicles };
}
