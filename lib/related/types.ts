// SEO/Meta Context / 関連コンテンツ（ポリモーフィック、参照のみ、BR-DOM-004）
export type RelatedContentType =
  | "vehicle"
  | "article"
  | "encyclopedia_entry"
  | "library_entry"
  | "maintenance_record";

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
