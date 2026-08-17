import Link from "next/link";
import { Card, CardImage, CardBody, CardTitle } from "@/components/ui/card";
import { VehicleCardPrice } from "@/components/inventory/vehicle-price";
import { VehicleCardSpecs } from "@/components/inventory/vehicle-card-specs";
import type { AutoRelatedItem, SimilarVehicle } from "@/lib/related/auto";

// 車両ページの下部に置く「次に見たくなるもの」。
//
// 単にリンクを並べるのではなく、なぜ出しているのか（同じ車種／近い年代／歴史 等）を
// 添える。理由の無い関連リンクは押す判断ができず、結局スクロールで飛ばされるため。

export function SimilarVehiclesSection({
  vehicles,
  photoUrls,
}: {
  vehicles: SimilarVehicle[];
  /** vehicles と同じ並びの先頭写真URL（無ければ undefined） */
  photoUrls: Array<string | undefined>;
}) {
  // 写真は車両と組にしてから絞り込む。
  // 先に vehicles だけを絞り込んで photoUrls[index] で引くと、slugが無い車両が
  // 1台でも混ざった時点で添字がずれ、**別の車の写真が出る**。
  // 高額商材でこれが起きると、見ている車と違う個体の写真を信じさせることになる。
  const shown = vehicles
    .map((vehicle, index) => ({ vehicle, photoUrl: photoUrls[index] }))
    .filter((item) => item.vehicle.slug);
  if (shown.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
        この車が気になった方へ
      </h2>
      <p className="text-foreground-muted mt-1 text-base">
        在庫の中から、近い条件の車両をご紹介します。
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-4 md:gap-6">
        {shown.map(({ vehicle: v, photoUrl }) => (
          <li key={v.id}>
            <Card href={`/vehicles/${v.slug}`}>
              <CardImage src={photoUrl} alt={v.name} />
              <CardBody className="p-4">
                <p className="text-primary-700 text-sm font-medium">
                  {v.reason}
                </p>
                <CardTitle className="text-base">{v.name}</CardTitle>
                <VehicleCardPrice price={v.price} totalPrice={v.total_price} />
                <VehicleCardSpecs
                  modelYear={v.model_year}
                  mileageKm={v.mileage_km}
                  shakenStatus={v.shaken_status}
                  shakenExpiry={v.shaken_expiry}
                  accidentHistory={v.accident_history}
                />
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

// 知識コンテンツへの導線。
// 種別ごとに分けず、理由ラベルを付けて1つの列に混ぜる。
// 「図鑑」「年表」といったサイト内部の分類は、読む側にとっては
// 「XJのことが分かる」という1つの関心でしかないため。
export function KnowledgeLinksSection({
  items,
  title = "この車をもっと知る",
  description,
}: {
  items: AutoRelatedItem[];
  title?: string;
  description?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="text-foreground-muted mt-1 text-base">{description}</p>
      )}
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={`${item.type}:${item.id}`}>
            <Link
              href={item.url}
              className="shadow-soft ease-premium hover:border-primary-200 hover:shadow-medium flex min-h-11 flex-col justify-center rounded-xl border border-neutral-200 bg-white px-4 py-3 transition-all duration-300"
            >
              <span className="text-foreground-muted text-sm">
                {item.reason}
              </span>
              <span className="text-charcoal-900 mt-0.5 font-medium">
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// 知識ページ（図鑑・年表）から在庫へ戻す導線。
// 「XJの解説を読んで興味を持った人が、その場でXJの在庫を見られる」ようにする（FR-ENC-005）。
export function RelatedInventorySection({
  vehicles,
  photoUrls,
  topic,
}: {
  vehicles: SimilarVehicle[];
  photoUrls: Array<string | undefined>;
  /** 見出しに出す話題名（車種名など） */
  topic: string;
}) {
  // 写真は車両と組にしてから絞り込む。
  // 先に vehicles だけを絞り込んで photoUrls[index] で引くと、slugが無い車両が
  // 1台でも混ざった時点で添字がずれ、**別の車の写真が出る**。
  // 高額商材でこれが起きると、見ている車と違う個体の写真を信じさせることになる。
  const shown = vehicles
    .map((vehicle, index) => ({ vehicle, photoUrl: photoUrls[index] }))
    .filter((item) => item.vehicle.slug);
  if (shown.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
        {topic}の在庫車両
      </h2>
      <p className="text-foreground-muted mt-1 text-base">
        いま実際にご覧いただける車両です。
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-4 md:gap-6">
        {shown.map(({ vehicle: v, photoUrl }) => (
          <li key={v.id}>
            <Card href={`/vehicles/${v.slug}`}>
              <CardImage src={photoUrl} alt={v.name} />
              <CardBody className="p-4">
                <CardTitle className="text-base">{v.name}</CardTitle>
                <VehicleCardPrice price={v.price} totalPrice={v.total_price} />
                <VehicleCardSpecs
                  modelYear={v.model_year}
                  mileageKm={v.mileage_km}
                  shakenStatus={v.shaken_status}
                  shakenExpiry={v.shaken_expiry}
                  accidentHistory={v.accident_history}
                />
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
