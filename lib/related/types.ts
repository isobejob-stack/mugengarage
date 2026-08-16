// SEO/Meta Context / 関連コンテンツ（ポリモーフィック、参照のみ、BR-DOM-004）
//
// 'maintenance_record' は整備実績のブログ統合（2026-08-17）で廃止した。
// ただしDBの related_contents には移行SQLを流すまで maintenance_record の行が残るため、
// lib/related/queries.ts 側は「知らない種別は黙って除外する」実装にしてある。
export type RelatedContentType =
  "vehicle" | "article" | "encyclopedia_entry" | "library_entry";

export interface RelatedContentTarget {
  type: RelatedContentType;
  id: string;
}

export interface RelatedContentCandidate extends RelatedContentTarget {
  label: string;
}

export interface RelatedContentItem extends RelatedContentTarget {
  label: string;
  url: string;
}
