import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPublicEncyclopediaEntryBySlug } from "@/lib/knowledge/queries";
import { encyclopediaCategoryLabels } from "@/lib/knowledge/schema";

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
      <nav className="text-sm text-neutral-500">
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

      <p className="mt-2 text-sm text-neutral-500">
        {encyclopediaCategoryLabels[entry.category]}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{entry.title}</h1>

      <div className="prose mt-6 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
      </div>

      {children.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">関連項目</h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/encyclopedia/${c.slug}`}
                  className="block rounded-md border border-neutral-200 p-3 hover:border-neutral-400"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
