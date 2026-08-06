import type { SeoTargetType } from "@/lib/seo/types";

// SEO/Meta Context（bounded_context.md 3章）: target_type ごとの公開URLプレフィックス。
// app/(public)/ 配下の実ルーティング構造に合わせる（BR-URL-003）。
// timeline_event は個別ページを持たない（app/(public)/timeline/ に [slug] ルートが存在しない、
// table_definitions.md 5.2 にも slug カラムがない）ため null を返す。
export function buildPublicPath(
  targetType: SeoTargetType,
  slug: string,
): string | null {
  switch (targetType) {
    case "vehicle":
      return `/vehicles/${slug}`;
    case "article":
      return `/blog/${slug}`;
    case "encyclopedia_entry":
      return `/encyclopedia/${slug}`;
    case "library_entry":
      return `/library/${slug}`;
    case "maintenance_record":
      return `/maintenance-records/${slug}`;
    case "timeline_event":
      return null;
    default:
      return null;
  }
}

// timeline_event 用のダミーslug。個別ページを持たないためルーティングには使用しないが、
// seo_metas.slug は NOT NULL UNIQUE 制約のため、seo_metasの行を作成する際に一意な値が必要になる。
export function buildTimelineFallbackSlug(timelineEventId: string) {
  return `timeline-event-${timelineEventId.slice(0, 8)}`;
}
