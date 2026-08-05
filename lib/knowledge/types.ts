import type { BaseEntity, SoftDeletable } from "@/lib/database/common";

// Knowledge Context（bounded_context.md 3章）: 在庫（Vehicle）に依存しない情報資産（BR-DOM-001〜003）
// 注意：本コンテキストの型はいずれもvehicle_idを持たない。在庫車両との紐付けは
// SEO/Meta Contextのrelated_contents（ポリモーフィック関連）経由で行う（er_diagram.md 5.5）。

export type EncyclopediaCategory =
  | "brand"
  | "series"
  | "model"
  | "generation"
  | "engine"
  | "technology"
  | "history"
  | "term";

export interface EncyclopediaEntry extends BaseEntity, SoftDeletable {
  category: EncyclopediaCategory;
  parent_id: string | null;
  title: string;
  slug: string;
  body: string;
  display_order: number;
}

export type TimelineEventCategory =
  "model_launch" | "engine_launch" | "motorsport" | "history" | "other";

export type TimelineDatePrecision = "year" | "month" | "day";

export interface TimelineEvent extends BaseEntity, SoftDeletable {
  event_date: string;
  date_precision: TimelineDatePrecision;
  category: TimelineEventCategory;
  title: string;
  body: string | null;
}

export interface LibraryEntry extends BaseEntity, SoftDeletable {
  title: string;
  slug: string;
  reading_kana: string | null;
  category: string | null;
  body: string;
}
