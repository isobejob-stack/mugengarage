import Link from "next/link";
import { listPublicEncyclopediaEntries } from "@/lib/knowledge/queries";
import { encyclopediaCategoryLabels } from "@/lib/knowledge/schema";

// SCR-PUB-008: Jaguar図鑑トップ／階層一覧（カテゴリ別に表示）
export default async function Page() {
  const entries = await listPublicEncyclopediaEntries();

  const grouped = Object.entries(encyclopediaCategoryLabels)
    .map(([category, label]) => ({
      category,
      label,
      items: entries.filter((e) => e.category === category),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Jaguar図鑑</h1>
      <p className="mt-2 text-neutral-600">
        ブランド・シリーズ・車種・世代・エンジン・技術・歴史・用語をまとめた図鑑です。
      </p>

      {grouped.length === 0 ? (
        <p className="mt-8 text-neutral-500">まだ項目がありません。</p>
      ) : (
        grouped.map((g) => (
          <section key={g.category} className="mt-8">
            <h2 className="text-lg font-bold">{g.label}</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {g.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/encyclopedia/${item.slug}`}
                    className="block rounded-md border border-neutral-200 p-3 hover:border-neutral-400"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
