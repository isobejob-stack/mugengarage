import type { BaseEntity } from "@/lib/database/common";

// SEO/Meta Context（bounded_context.md 3章）: 全コンテンツ種別共通のSEO・関連付け・URL管理
// seo_metas / related_contents / taggings はポリモーフィック関連（er_diagram.md 5.3）

export type SeoTargetType =
  | "vehicle"
  | "article"
  | "encyclopedia_entry"
  | "timeline_event"
  | "library_entry"
  | "maintenance_record";

export interface SeoMeta extends BaseEntity {
  target_type: SeoTargetType;
  target_id: string;
  title: string | null;
  description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  structured_data: Record<string, unknown> | null;
  slug: string;
}

export interface RelatedContent extends BaseEntity {
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  display_order: number;
}

export interface Redirect extends BaseEntity {
  old_path: string;
  new_path: string;
}

export interface Tag extends BaseEntity {
  name: string;
  slug: string;
}

export type TaggableType = "vehicle" | "article";

export interface Tagging extends BaseEntity {
  tag_id: string;
  taggable_type: TaggableType;
  taggable_id: string;
}
