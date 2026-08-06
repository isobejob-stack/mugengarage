import Link from "next/link";
import type { RelatedContentItem } from "@/lib/related/types";

// FR-VEH-005 / FR-TL-003 / FR-LIB-002 / FR-MNT-002: 公開ページの関連コンテンツ表示
export function RelatedContentList({
  items,
  title = "関連コンテンツ",
}: {
  items: RelatedContentItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={`${item.type}:${item.id}`}>
            <Link
              href={item.url}
              className="block rounded-md border border-neutral-200 p-3 hover:border-neutral-400"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
