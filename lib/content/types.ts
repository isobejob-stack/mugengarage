import type { BaseEntity, SoftDeletable } from "@/lib/database/common";

// Content Context（bounded_context.md 3章）: 記事・整備実績等の発信コンテンツ管理

export type ArticleStatus = "draft" | "published";

export interface Article extends BaseEntity, SoftDeletable {
  title: string;
  slug: string;
  body: string;
  status: ArticleStatus;
  category: string | null;
  scheduled_publish_at: string | null;
  published_at: string | null;
}

export interface MaintenanceRecord extends BaseEntity, SoftDeletable {
  title: string;
  slug: string;
  category: string | null;
  issue_description: string | null;
  cost: number | null;
  body: string;
}
