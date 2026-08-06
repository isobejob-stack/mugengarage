import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { relatedContentTypeLabels } from "@/lib/related/schema";
import type {
  RelatedContentCandidate,
  RelatedContentItem,
  RelatedContentTarget,
  RelatedContentType,
} from "@/lib/related/types";

function buildUrl(type: RelatedContentType, slug: string) {
  switch (type) {
    case "vehicle":
      return `/vehicles/${slug}`;
    case "article":
      return `/blog/${slug}`;
    case "encyclopedia_entry":
      return `/encyclopedia/${slug}`;
    case "library_entry":
      return `/library/${slug}`;
  }
}

// 管理画面の関連コンテンツ選択候補（許可された種別のみ取得、BR-DATA-002準拠でコピーせず参照のみ）
export async function listRelatedContentCandidates(
  types: RelatedContentType[],
): Promise<RelatedContentCandidate[]> {
  const supabase = createAdminClient();
  const candidates: RelatedContentCandidate[] = [];

  if (types.includes("vehicle")) {
    const { data } = await supabase
      .from("vehicles")
      .select("id, model_year, models(name)")
      .is("deleted_at", null)
      .order("display_order");
    for (const v of (data ?? []) as unknown as Array<{
      id: string;
      model_year: number | null;
      models: { name: string } | null;
    }>) {
      candidates.push({
        type: "vehicle",
        id: v.id,
        label: `${v.models?.name ?? "車両"}${v.model_year ? `（${v.model_year}年）` : ""}`,
      });
    }
  }

  if (types.includes("article")) {
    const { data } = await supabase
      .from("articles")
      .select("id, title")
      .is("deleted_at", null)
      .order("title");
    for (const a of data ?? []) {
      candidates.push({ type: "article", id: a.id, label: a.title });
    }
  }

  if (types.includes("encyclopedia_entry")) {
    const { data } = await supabase
      .from("encyclopedia_entries")
      .select("id, title")
      .is("deleted_at", null)
      .order("title");
    for (const e of data ?? []) {
      candidates.push({
        type: "encyclopedia_entry",
        id: e.id,
        label: e.title,
      });
    }
  }

  if (types.includes("library_entry")) {
    const { data } = await supabase
      .from("library_entries")
      .select("id, title")
      .is("deleted_at", null)
      .order("title");
    for (const l of data ?? []) {
      candidates.push({ type: "library_entry", id: l.id, label: l.title });
    }
  }

  return candidates;
}

// 特定コンテンツに紐付いた関連コンテンツを、表示用のラベル・URL付きで取得する
export async function listRelatedContents(
  fromType: string,
  fromId: string,
): Promise<RelatedContentItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("related_contents")
    .select("to_type, to_id")
    .eq("from_type", fromType)
    .eq("from_id", fromId)
    .order("display_order");

  const rows = (data ?? []) as Array<{
    to_type: RelatedContentType;
    to_id: string;
  }>;
  if (rows.length === 0) return [];

  const idsByType = new Map<RelatedContentType, string[]>();
  for (const r of rows) {
    idsByType.set(r.to_type, [...(idsByType.get(r.to_type) ?? []), r.to_id]);
  }

  const items = new Map<string, RelatedContentItem>();

  const vehicleIds = idsByType.get("vehicle");
  if (vehicleIds) {
    const [{ data: vehicles }, { data: seoMetas }] = await Promise.all([
      supabase
        .from("vehicles")
        .select("id, model_year, models(name)")
        .in("id", vehicleIds)
        .eq("status", "published")
        .is("deleted_at", null),
      supabase
        .from("seo_metas")
        .select("target_id, slug")
        .eq("target_type", "vehicle")
        .in("target_id", vehicleIds),
    ]);
    const slugMap = new Map((seoMetas ?? []).map((s) => [s.target_id, s.slug]));
    for (const v of (vehicles ?? []) as unknown as Array<{
      id: string;
      model_year: number | null;
      models: { name: string } | null;
    }>) {
      const slug = slugMap.get(v.id);
      if (!slug) continue;
      items.set(`vehicle:${v.id}`, {
        type: "vehicle",
        id: v.id,
        label: `${v.models?.name ?? "車両"}${v.model_year ? `（${v.model_year}年）` : ""}`,
        url: buildUrl("vehicle", slug),
      });
    }
  }

  const articleIds = idsByType.get("article");
  if (articleIds) {
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug")
      .in("id", articleIds)
      .eq("status", "published")
      .is("deleted_at", null);
    for (const a of data ?? []) {
      items.set(`article:${a.id}`, {
        type: "article",
        id: a.id,
        label: a.title,
        url: buildUrl("article", a.slug),
      });
    }
  }

  const encyclopediaIds = idsByType.get("encyclopedia_entry");
  if (encyclopediaIds) {
    const { data } = await supabase
      .from("encyclopedia_entries")
      .select("id, title, slug")
      .in("id", encyclopediaIds)
      .is("deleted_at", null);
    for (const e of data ?? []) {
      items.set(`encyclopedia_entry:${e.id}`, {
        type: "encyclopedia_entry",
        id: e.id,
        label: e.title,
        url: buildUrl("encyclopedia_entry", e.slug),
      });
    }
  }

  const libraryIds = idsByType.get("library_entry");
  if (libraryIds) {
    const { data } = await supabase
      .from("library_entries")
      .select("id, title, slug")
      .in("id", libraryIds)
      .is("deleted_at", null);
    for (const l of data ?? []) {
      items.set(`library_entry:${l.id}`, {
        type: "library_entry",
        id: l.id,
        label: l.title,
        url: buildUrl("library_entry", l.slug),
      });
    }
  }

  return rows
    .map((r) => items.get(`${r.to_type}:${r.to_id}`))
    .filter((x): x is RelatedContentItem => Boolean(x));
}

// 関連コンテンツを全置換する（保存のたびに削除→再挿入。BR-DOM-004: 参照のみでコピーしない）
export async function replaceRelatedContents(
  fromType: string,
  fromId: string,
  targets: RelatedContentTarget[],
) {
  const supabase = createAdminClient();
  await supabase
    .from("related_contents")
    .delete()
    .eq("from_type", fromType)
    .eq("from_id", fromId);

  if (targets.length === 0) return;

  await supabase.from("related_contents").insert(
    targets.map((t, i) => ({
      from_type: fromType,
      from_id: fromId,
      to_type: t.type,
      to_id: t.id,
      display_order: i,
    })),
  );
}

export { relatedContentTypeLabels };
