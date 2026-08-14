import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicLibraryEntryBySlug } from "@/lib/library/queries";
import { listRelatedContents } from "@/lib/related/queries";
import { RelatedContentList } from "@/components/related/related-content-list";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { RelatedInventorySection } from "@/components/related/related-discovery";
import { getVehiclesRelatedToTitle } from "@/lib/related/auto";
import { getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import {
  buildDefinedTermStructuredData,
  serializeStructuredData,
} from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site-config";

// 各詳細ページに固有のtitle/descriptionを与える。従来はルートlayoutの値を継承しており、
// 検索結果でどのページも同じ文言になっていた（docs/tasks/ISSUE-005）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublicLibraryEntryBySlug(slug);

  if (!entry) return {};

  return buildPageMetadata({
    title: entry.title,
    description:
      excerptFromMarkdown(entry.body) || "クラシックJaguarの用語解説です。",
    path: `/library/${slug}`,
  });
}

// SCR-PUB-012: ライブラリ詳細（用語集・図鑑・ブログへの相互リンク、FR-LIB-002）
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getPublicLibraryEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const related = await listRelatedContents("library_entry", entry.id);

  // FR-SEO-002: このページが用語の定義であることを示す。
  // 「SUキャブレターとは」のような語義を探す検索に対して、
  // 投入済みの用語30件をそのまま検索露出に変えるための実装（ISSUE-005 4章）。
  const structuredDataJson = serializeStructuredData(
    buildDefinedTermStructuredData({
      term: entry.title,
      description: excerptFromMarkdown(entry.body),
      url: `${SITE_URL}/library/${slug}`,
      category: entry.category,
    }),
  );

  // 記事の話題に対応する在庫車両（FR-ENC-005と同じ考え方の逆方向導線）。
  // 読み物として満足して終わらせず、実車へ進める道を残す。
  const { modelName: relatedModelName, vehicles: relatedVehicles } =
    await getVehiclesRelatedToTitle(entry.title);
  const relatedPhotoPaths = await getLeadVehiclePhotoPaths(
    relatedVehicles.map((v) => v.id),
  );
  const relatedPhotoUrls = relatedVehicles.map((v) => {
    const path = relatedPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : undefined;
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <Breadcrumb
        items={[
          { label: "ライブラリ", href: "/library" },
          { label: entry.title },
        ]}
      />
      {entry.category && (
        <p className="text-foreground-muted text-sm">{entry.category}</p>
      )}
      <h1 className="text-charcoal-900 mt-1 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {entry.title}
      </h1>

      <div className="prose mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
      </div>

      <RelatedContentList
        items={related}
        title="関連する用語集・図鑑・ブログ"
      />
      <RelatedInventorySection
        vehicles={relatedVehicles}
        photoUrls={relatedPhotoUrls}
        topic={relatedModelName ?? ""}
      />
    </main>
  );
}
