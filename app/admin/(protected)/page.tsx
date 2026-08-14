import { listAdminInquiries } from "@/lib/crm/queries";
import { getAdminFavoriteCounts } from "@/lib/engagement/queries";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

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
  const [inquiries, favoriteCounts] = await Promise.all([
    listAdminInquiries(),
    getAdminFavoriteCounts(5),
  ]);
  const unhandledCount = inquiries.filter(
    (i) => i.response_status === "unhandled",
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        ダッシュボード
      </h1>

      <Card href="/admin/inquiries" className="mt-6 hover:-translate-y-0.5">
        <CardBody className="flex flex-row items-center justify-between gap-4 p-6">
          <div>
            <p className="text-foreground-muted text-base">
              未対応の問い合わせ
            </p>
            <p
              className={`mt-1 text-4xl font-bold tabular-nums ${
                unhandledCount > 0 ? "text-red-600" : "text-charcoal-900"
              }`}
            >
              {unhandledCount}件
            </p>
          </div>
          <StatusBadge
            label={unhandledCount > 0 ? "対応が必要です" : "対応済み"}
            tone={unhandledCount > 0 ? "danger" : "success"}
          />
        </CardBody>
      </Card>

      {favoriteCounts.length > 0 && (
        <>
          <h2 className="text-charcoal-900 mt-8 font-serif text-lg font-bold">
            お気に入り登録数（上位）
          </h2>
          <Card className="mt-3">
            <CardBody className="p-4">
              <ul className="flex flex-col divide-y divide-neutral-100">
                {favoriteCounts.map((v) => (
                  <li
                    key={v.id}
                    className="flex items-center justify-between gap-4 py-3 text-base first:pt-0 last:pb-0"
                  >
                    <span className="text-charcoal-900">
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </span>
                    <span className="text-primary-700 font-mono font-semibold">
                      ♥ {v.favoriteCount}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </>
      )}

      <h2 className="text-charcoal-900 mt-8 font-serif text-lg font-bold">
        よく使う操作
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Button
            key={s.href}
            href={s.href}
            variant="outline"
            size="md"
            className="w-full justify-center"
          >
            {s.label}
          </Button>
        ))}
      </div>
    </main>
  );
}
