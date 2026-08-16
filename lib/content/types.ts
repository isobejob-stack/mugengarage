import type { BaseEntity, SoftDeletable } from "@/lib/database/common";

// Content Context（bounded_context.md 3章）: 記事等の発信コンテンツ管理
//
// 整備実績（maintenance_records）は2026-08-17にブログへ統合し、型・画面ともに廃止した。
// 整備の記録は articles の category='整備記録'（lib/content/categories.ts）として扱う。

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
