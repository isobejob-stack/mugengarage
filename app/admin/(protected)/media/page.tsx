import Image from "next/image";
import { listVehicleMediaStatus } from "@/lib/inventory/media";
import { Button } from "@/components/ui/button";
import { VehicleStatusBadge } from "@/components/ui/status-badge";
import type { VehicleStatus } from "@/lib/inventory/types";

// SCR-ADM-021 ・ FR-ADM-003: メディア管理
//
// ファイル一覧ではなく「写真の登録状況」の画面にしている。
// この店で実際に困っているのは、どのファイルがあるかではなく
// **どの車両に写真が無いか**であり、在庫21台に対して写真は1枚しかない（2026-08-17）。
// 写真の有無は問い合わせ数に直結するため、0枚の車両を先頭に出して
// そのまま追加画面へ進める形にする。
export const dynamic = "force-dynamic";

export default async function Page() {
  const rows = await listVehicleMediaStatus();
  const missing = rows.filter((r) => r.photoCount === 0);
  const missingPublished = missing.filter((r) => r.status === "published");
  const totalPhotos = rows.reduce((sum, r) => sum + r.photoCount, 0);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        写真の登録状況
      </h1>
      <p className="text-foreground-muted mt-2 text-base leading-relaxed">
        車両ごとの写真・動画の登録数です。写真が無い車両を先頭に出しています。
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="登録済みの写真" value={`${totalPhotos}枚`} />
        <Stat label="写真が無い車両" value={`${missing.length}台`} />
        {/* 公開中なのに写真が無い車両は、いまお客様が見て落胆している画面そのもの。
            数字として独立させて出す。 */}
        <Stat
          label="うち公開中"
          value={`${missingPublished.length}台`}
          danger={missingPublished.length > 0}
        />
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <div className="bg-cream-100 relative size-20 shrink-0 overflow-hidden rounded-lg">
              {row.leadPhotoUrl ? (
                <Image
                  src={row.leadPhotoUrl}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span className="text-foreground-muted flex h-full items-center justify-center text-sm">
                  なし
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-charcoal-900 text-base font-medium">
                {row.name}
              </p>
              <p className="text-foreground-muted mt-1 text-base">
                写真 {row.photoCount}枚 ／ 動画 {row.videoCount}本
              </p>
            </div>

            <VehicleStatusBadge status={row.status as VehicleStatus} />

            <Button
              href={`/admin/vehicles/${row.id}/edit`}
              variant={row.photoCount === 0 ? "primary" : "outline"}
              size="sm"
            >
              {row.photoCount === 0 ? "写真を追加する" : "写真を管理する"}
            </Button>
          </li>
        ))}
      </ul>
    </main>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-foreground-muted text-base">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          danger ? "text-red-600" : "text-charcoal-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
