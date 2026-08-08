import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-config";

// サイトマップは1時間ごとに再生成する（FR-SEO-005: サイトマップ自動生成）
export const revalidate = 3600;

// FR-SEO-005: 公開中の全コンテンツ種別のURLを列挙したXMLサイトマップを自動生成する（Next.js標準のMetadata Routes機能）。
// 対象は「公開中」のコンテンツのみとする（BR-DEL-001の論理削除済み・非公開ステータスのものは含めない）。
// timeline_eventは個別ページを持たない（lib/seo/paths.ts参照）ため一覧ページのみ含める。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/vehicles`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${SITE_URL}/vehicles/ranking`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    { url: `${SITE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
    {
      url: `${SITE_URL}/encyclopedia`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${SITE_URL}/timeline`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/library`, changeFrequency: "weekly", priority: 0.6 },
    {
      url: `${SITE_URL}/maintenance-records`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/owners-archive`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.4 },
  ];

  // サイトマップはビルド時にプリレンダリングされる唯一のDB依存ページであり、ここで例外を投げると
  // 「Export encountered an error on /sitemap.xml/route」でビルド全体が落ちる。
  // つまりSupabaseの環境変数漏れや一時的な障害だけで、他の全ページの更新まで本番に出せなくなる。
  // サイトマップはSEO上の補助情報であり、それ1つのためにデプロイ全体を止める価値はないため、
  // 失敗時は静的URLのみのサイトマップに縮退させ、原因はログに残す（revalidate=3600により
  // 環境変数の修正やDB復旧後は1時間以内に自動で完全なサイトマップへ回復する）。
  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    dynamicEntries = await collectDynamicEntries();
  } catch (error) {
    console.error(
      "[sitemap] 動的URLの取得に失敗したため、静的URLのみでサイトマップを生成しました。" +
        "Supabaseの環境変数（NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）と接続状態を確認してください。",
      error,
    );
  }

  return [...staticEntries, ...dynamicEntries];
}

async function collectDynamicEntries(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [
    vehicles,
    vehicleSeoMetas,
    articles,
    encyclopediaEntries,
    libraryEntries,
    maintenanceRecords,
    ownerArchiveEntries,
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, updated_at")
      .eq("status", "published")
      .is("deleted_at", null),
    supabase
      .from("seo_metas")
      .select("target_id, slug")
      .eq("target_type", "vehicle"),
    supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("status", "published")
      .is("deleted_at", null),
    supabase
      .from("encyclopedia_entries")
      .select("slug, updated_at")
      .is("deleted_at", null),
    supabase
      .from("library_entries")
      .select("slug, updated_at")
      .is("deleted_at", null),
    supabase
      .from("maintenance_records")
      .select("slug, updated_at")
      .is("deleted_at", null),
    supabase
      .from("owner_archive_entries")
      .select("vehicle_id, updated_at")
      .eq("is_published", true)
      .is("deleted_at", null),
  ]);

  const vehicleSlugById = new Map(
    (vehicleSeoMetas.data ?? []).map((s) => [s.target_id, s.slug]),
  );

  const vehicleEntries: MetadataRoute.Sitemap = [];
  for (const v of vehicles.data ?? []) {
    const slug = vehicleSlugById.get(v.id);
    if (!slug) continue;
    vehicleEntries.push({
      url: `${SITE_URL}/vehicles/${slug}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const articleEntries: MetadataRoute.Sitemap = (articles.data ?? []).map(
    (a) => ({
      url: `${SITE_URL}/blog/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }),
  );

  const encyclopediaSitemapEntries: MetadataRoute.Sitemap = (
    encyclopediaEntries.data ?? []
  ).map((e) => ({
    url: `${SITE_URL}/encyclopedia/${e.slug}`,
    lastModified: e.updated_at ? new Date(e.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const librarySitemapEntries: MetadataRoute.Sitemap = (
    libraryEntries.data ?? []
  ).map((l) => ({
    url: `${SITE_URL}/library/${l.slug}`,
    lastModified: l.updated_at ? new Date(l.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const maintenanceSitemapEntries: MetadataRoute.Sitemap = (
    maintenanceRecords.data ?? []
  ).map((m) => ({
    url: `${SITE_URL}/maintenance-records/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const ownerArchiveSitemapEntries: MetadataRoute.Sitemap = (
    ownerArchiveEntries.data ?? []
  ).map((o) => ({
    url: `${SITE_URL}/owners-archive/${o.vehicle_id}`,
    lastModified: o.updated_at ? new Date(o.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  return [
    ...vehicleEntries,
    ...articleEntries,
    ...encyclopediaSitemapEntries,
    ...librarySitemapEntries,
    ...maintenanceSitemapEntries,
    ...ownerArchiveSitemapEntries,
  ];
}
