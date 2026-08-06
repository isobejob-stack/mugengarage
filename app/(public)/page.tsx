import Link from "next/link";
import { listPublicVehicles } from "@/lib/inventory/queries";
import { LINE_URL } from "@/lib/site-config";
import { LineConsultationMenu } from "@/components/layout/line-consultation-menu";

// SCR-PUB-001: トップページ（FR-INV-005, FR-LINE-001, FR-SEO-001）
export default async function Page() {
  const vehicles = await listPublicVehicles();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-lg bg-neutral-900 px-6 py-12 text-white">
        <h1 className="text-2xl font-bold">エムガレージ</h1>
        <p className="mt-2 text-neutral-300">
          30年以上の実績を持つクラシックJaguar専門店。販売・整備・修理・買取・ご相談まで、Jaguarのことなら何でもお任せください。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/vehicles"
            className="min-h-11 rounded-md bg-white px-5 py-2 font-medium text-neutral-900"
          >
            在庫車両を見る
          </Link>
          <a
            href={LINE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 rounded-md bg-green-600 px-5 py-2 font-medium text-white"
          >
            LINEで相談する
          </a>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">在庫車両</h2>
          <Link href="/vehicles" className="text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        {vehicles.length === 0 ? (
          <p className="mt-4 text-neutral-500">
            現在公開中の車両はありません。
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {vehicles.slice(0, 3).map((v) =>
              v.slug ? (
                <li key={v.id}>
                  <Link
                    href={`/vehicles/${v.slug}`}
                    className="block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
                  >
                    <p className="font-medium">
                      {v.manufacturers?.name} {v.models?.name}
                    </p>
                    <p className="mt-1 font-bold">
                      ¥{v.price.toLocaleString()}
                    </p>
                  </Link>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>

      {/* FR-LINE-002: 相談カテゴリ表示（購入／修理／売却／部品／Jaguar全般／カーライフ相談） */}
      <div className="mt-10">
        <LineConsultationMenu />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Jaguarを知る</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/encyclopedia"
            className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
          >
            <p className="font-medium">Jaguar図鑑</p>
            <p className="mt-1 text-sm text-neutral-500">
              ブランド・シリーズ・車種・世代を体系的に紹介
            </p>
          </Link>
          <Link
            href="/timeline"
            className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
          >
            <p className="font-medium">Jaguar年表</p>
            <p className="mt-1 text-sm text-neutral-500">
              ブランドの歴史を時系列でたどる
            </p>
          </Link>
          <Link
            href="/library"
            className="rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
          >
            <p className="font-medium">ライブラリ</p>
            <p className="mt-1 text-sm text-neutral-500">
              Jaguarに関する知識を辞典形式で
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
