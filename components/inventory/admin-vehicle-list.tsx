"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { VehicleStatusBadge, StatusBadge } from "@/components/ui/status-badge";
import { VehicleListActions } from "@/components/inventory/vehicle-list-actions";
import type { AdminVehicleListItem } from "@/lib/inventory/queries";
import type { VehicleStatus } from "@/lib/inventory/types";

// 管理画面の車両一覧。
//
// 在庫の大半が「ジャガー XJ」で、車名と年式だけでは目的の1台を選べない
// （supabase/setup.sql の時点で XJ が10台）。そこで、
//   - 写真・グレード・走行距離を並べて、行を見分けられるようにする
//   - 絞り込み欄で、覚えている手がかり（年式・グレード・価格）から辿れるようにする
// の2つで「目的の1台に行き着く」ことを支える。
//
// 絞り込みは画面の中だけで行う。在庫は数十台で全件を最初から持っており、
// サーバーへ問い合わせ直すと入力のたびに待ち時間が出るため。

function vehicleName(vehicle: AdminVehicleListItem) {
  return (
    [vehicle.manufacturers?.name, vehicle.models?.name]
      .filter(Boolean)
      .join(" ") || "（車種未設定）"
  );
}

// 絞り込みで突き合わせる文字列。
// 「2007」「ソブリン」「59000」のどれで打っても引けるように、
// 表示している手がかりをすべて1本につないでおく。
function searchableText(vehicle: AdminVehicleListItem) {
  return [
    vehicle.manufacturers?.name,
    vehicle.models?.name,
    vehicle.grades?.name,
    vehicle.model_year,
    vehicle.mileage_km,
    vehicle.price,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" ")
    .toLowerCase();
}

export function AdminVehicleList({
  vehicles,
}: {
  vehicles: AdminVehicleListItem[];
}) {
  const [query, setQuery] = useState("");
  const [photolessOnly, setPhotolessOnly] = useState(false);

  const searchIndex = useMemo(
    () => new Map(vehicles.map((v) => [v.id, searchableText(v)])),
    [vehicles],
  );

  const filtered = useMemo(() => {
    // 空白区切りの語をすべて含むものを残す（「XJ 2007」で絞れるようにする）
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

    return vehicles.filter((vehicle) => {
      if (photolessOnly && vehicle.photoCount > 0) return false;
      if (terms.length === 0) return true;
      const text = searchIndex.get(vehicle.id) ?? "";
      return terms.every((term) => text.includes(term));
    });
  }, [vehicles, query, photolessOnly, searchIndex]);

  const photolessCount = vehicles.filter((v) => v.photoCount === 0).length;

  if (vehicles.length === 0) {
    return (
      <p className="text-foreground-muted mt-8 text-base">
        登録された車両はまだありません。
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">車両を絞り込む</span>
          <input
            type="search"
            className="input"
            placeholder="車種・グレード・年式・価格で絞り込む"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {photolessCount > 0 && (
          <Button
            type="button"
            variant={photolessOnly ? "primary" : "outline"}
            size="md"
            onClick={() => setPhotolessOnly((on) => !on)}
          >
            写真が無い{photolessCount}台
          </Button>
        )}
      </div>

      <p className="text-foreground-muted mt-3 text-base" aria-live="polite">
        {filtered.length === vehicles.length
          ? `全${vehicles.length}台`
          : `${vehicles.length}台のうち${filtered.length}台を表示`}
      </p>

      {filtered.length === 0 ? (
        <p className="text-foreground-muted mt-6 text-base">
          条件に合う車両がありません。絞り込みの言葉を減らしてみてください。
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {filtered.map((v) => (
            <li key={v.id}>
              <Card>
                <CardBody className="flex flex-row flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    {/* 同じ車名が並ぶ一覧で、行を見分ける一番速い手がかりが写真。
                        無い車両は空欄にせず「写真なし」と書く。空欄だと
                        「読み込み中なのか、本当に無いのか」が分からない。 */}
                    {v.leadPhotoUrl ? (
                      <Image
                        src={v.leadPhotoUrl}
                        alt=""
                        width={96}
                        height={72}
                        className="h-18 w-24 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="bg-cream-50 text-foreground-muted flex h-18 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm">
                        写真なし
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-charcoal-900 text-lg font-semibold">
                        {vehicleName(v)}
                        {v.model_year ? `（${v.model_year}年）` : ""}
                      </p>
                      {v.grades?.name && (
                        <p className="text-charcoal-700 text-base">
                          {v.grades.name}
                        </p>
                      )}
                      <p className="text-foreground-muted text-base">
                        ¥{v.price.toLocaleString()}
                        {v.mileage_km !== null &&
                          ` ・ ${v.mileage_km.toLocaleString()}km`}
                        {v.photoCount > 0 && ` ・ 写真${v.photoCount}枚`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    {/* 公開中なのに写真が無い車両は、いまお客様が見て落胆している画面。
                        一覧の時点で目立たせる。 */}
                    {v.photoCount === 0 && v.status === "published" && (
                      <StatusBadge label="写真を追加してください" tone="danger" />
                    )}
                    <VehicleStatusBadge status={v.status as VehicleStatus} />
                    {v.status === "sold" && (
                      <Button
                        href={`/admin/owners-archive/${v.id}/edit`}
                        variant="outline"
                        size="sm"
                      >
                        アーカイブ編集
                      </Button>
                    )}
                    <VehicleListActions
                      vehicleId={v.id}
                      vehicleName={vehicleName(v)}
                      isSold={v.status === "sold"}
                    />
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
