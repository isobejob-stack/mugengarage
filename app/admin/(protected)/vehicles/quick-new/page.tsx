import { getVehicleHierarchyOptions } from "@/lib/inventory/queries";
import { QuickVehicleRegister } from "@/components/inventory/quick-vehicle-register";

// FR-INV-001 / FR-INV-009: 現地即時登録フロー（車両一覧「現地でクイック登録」からの導線）
// 通常の車両登録フォーム（SCR-ADM-004, /admin/vehicles/new）と同じPOST /api/admin/vehiclesを
// 最小限の項目（メーカー・車種・参考価格）のみで呼び出し、登録直後にその場で写真アップロードへ
// 切り替える。諸元・コメント等の詳細入力は、既存の編集フォーム（/admin/vehicles/:id/edit）で
// 後から行う想定。
export default async function Page() {
  const options = await getVehicleHierarchyOptions();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        現地でクイック登録
      </h1>
      <p className="mt-2 text-base text-foreground-muted">
        メーカー・車種・参考価格だけ入力してすぐに登録し、その場で写真を撮ってアップロードできます。諸元やコメントなどの詳細情報は後から入力できます。
      </p>
      <div className="mt-6">
        <QuickVehicleRegister
          manufacturers={options.manufacturers}
          models={options.models}
        />
      </div>
    </main>
  );
}
