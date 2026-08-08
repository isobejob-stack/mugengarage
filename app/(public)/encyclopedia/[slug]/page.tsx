import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicEncyclopediaEntryBySlug } from "@/lib/knowledge/queries";
import { encyclopediaCategoryLabels } from "@/lib/knowledge/schema";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { buildPageMetadata, excerptFromMarkdown } from "@/lib/seo/metadata";

// 各詳細ページに固有のtitle/descriptionを与える。従来はルートlayoutの値を継承しており、
// 検索結果でどのページも同じ文言になっていた（docs/tasks/ISSUE-005）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // このクエリは親子関係を含めて返すため、項目自体は result.entry に入っている
  const result = await getPublicEncyclopediaEntryBySlug(slug);

  if (!result?.entry) return {};

  return buildPageMetadata({
    title: result.entry.title,
    description:
      excerptFromMarkdown(result.entry.body) || "Jaguar図鑑の解説ページです。",
    path: `/encyclopedia/${slug}`,
  });
}

// SCR-PUB-009: 図鑑詳細（在庫非依存で単体公開できる、BR-DOM-001）
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicEncyclopediaEntryBySlug(slug);

  if (!result) {
    notFound();
  }

  const { entry, parent, children } = result;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-foreground-muted">
        <Link href="/encyclopedia" className="hover:underline">
          図鑑
        </Link>
        {parent && (
          <>
            {" / "}
            <Link
              href={`/encyclopedia/${parent.slug}`}
              className="hover:underline"
            >
              {parent.title}
            </Link>
          </>
        )}
        {" / "}
        {entry.title}
      </nav>

      <p className="mt-2 text-sm text-foreground-muted">
        {encyclopediaCategoryLabels[entry.category]}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        {entry.title}
      </h1>

      <div className="prose mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
      </div>

      {children.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            関連項目
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {children.map((c) => (
              <li key={c.id}>
                <Card href={`/encyclopedia/${c.slug}`}>
                  <CardBody className="p-4">
                    <CardTitle>{c.title}</CardTitle>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
