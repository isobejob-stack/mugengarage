import Link from "next/link";
import { listAdminInquiries } from "@/lib/crm/queries";

const shortcuts = [
  { label: "車両を登録する", href: "/admin/vehicles/new" },
  { label: "記事を書く", href: "/admin/articles/new" },
  { label: "図鑑項目を追加する", href: "/admin/encyclopedia/new" },
  { label: "年表イベントを追加する", href: "/admin/timeline/new" },
  { label: "ライブラリ項目を追加する", href: "/admin/library/new" },
  { label: "整備実績を追加する", href: "/admin/maintenance-records/new" },
] as const;

// SCR-ADM-002: ダッシュボード（未対応問い合わせ件数・よく使う操作へのショートカット）
export default async function Page() {
  const inquiries = await listAdminInquiries();
  const unhandledCount = inquiries.filter(
    (i) => i.response_status === "unhandled",
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <Link
        href="/admin/inquiries"
        className="mt-6 block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
      >
        <p className="text-sm text-neutral-500">未対応の問い合わせ</p>
        <p className="mt-1 text-3xl font-bold">{unhandledCount}件</p>
      </Link>

      <h2 className="mt-8 text-lg font-bold">よく使う操作</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="min-h-11 rounded-md border border-neutral-300 px-4 py-3 text-center font-medium hover:border-neutral-500"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
