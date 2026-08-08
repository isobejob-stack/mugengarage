import Link from "next/link";
import { listPublicVehicles, getLeadVehiclePhotoPaths } from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { LINE_URL } from "@/lib/site-config";
import { LineConsultationMenu } from "@/components/layout/line-consultation-menu";
import { Button } from "@/components/ui/button";
import { Card, CardImage, CardBody, CardTitle, CardMeta, CardPrice } from "@/components/ui/card";
import { VehicleFeatureBadges } from "@/components/ui/status-badge";

// トップページは掲載中の車両をDBから取得しているため、静的生成されると車両を登録・公開しても
// 次回デプロイまでトップに出ない（最も目に付く画面で更新が反映されない状態になる）。
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

const ENCYCLOPEDIA_LINKS = [
  {
    href: "/encyclopedia",
    title: "Jaguar図鑑",
    description: "ブランド・シリーズ・車種・世代を体系的に紹介",
  },
  {
    href: "/timeline",
    title: "Jaguar年表",
    description: "ブランドの歴史を時系列でたどる",
  },
  {
    href: "/library",
    title: "ライブラリ",
    description: "Jaguarに関する知識を辞典形式で",
  },
] as const;

// SCR-PUB-001: トップページ（FR-INV-005, FR-LINE-001, FR-SEO-001）
export default async function Page() {
  const vehicles = await listPublicVehicles();
  const featuredVehicles = vehicles.slice(0, 3);

  // 在庫車両カードのサムネイル用に、トップ3件分のみ先頭写真を1クエリでまとめて取得する
  const leadPhotoPaths = await getLeadVehiclePhotoPaths(
    featuredVehicles.map((v) => v.id),
  );
  const featuredPhotoUrls = featuredVehicles.map((v) => {
    const path = leadPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : null;
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-2xl bg-charcoal-900 px-6 py-12 text-white shadow-medium sm:px-10 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-accent-400">
          Classic Jaguar Specialist
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
          エムガレージ
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-300">
          30年以上の実績を持つクラシックJaguar専門店。販売・整備・修理・買取・ご相談まで、Jaguarのことなら何でもお任せください。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/vehicles" variant="secondary" size="lg">
            在庫車両を見る
          </Button>
          <Button href={LINE_URL} variant="line" size="lg">
            LINEで相談する
          </Button>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
            在庫車両
          </h2>
          <Link href="/vehicles" className="text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        {featuredVehicles.length === 0 ? (
          <p className="mt-4 text-foreground-muted">
            現在公開中の車両はありません。
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {featuredVehicles.map((v, index) =>
              v.slug ? (
                <li key={v.id}>
                  <Card href={`/vehicles/${v.slug}`}>
                    <VehicleFeatureBadges
                      isRecommended={v.is_recommended}
                      isNewArrival={v.is_new_arrival}
                    />
                    {/* 先頭カードの写真はファーストビューに入りLCPになりやすいため、
                        遅延読み込みを外して表示を前倒しする（2枚目以降は遅延のまま） */}
                    <CardImage
                      src={featuredPhotoUrls[index] ?? undefined}
                      alt={`${v.manufacturers?.name ?? ""} ${v.models?.name ?? ""}`}
                      priority={index === 0}
                    />
                    <CardBody>
                      <CardTitle>
                        {v.manufacturers?.name} {v.models?.name}
                      </CardTitle>
                      {v.model_year !== null && (
                        <CardMeta>{v.model_year}年</CardMeta>
                      )}
                      <CardPrice>¥{v.price.toLocaleString()}</CardPrice>
                    </CardBody>
                  </Card>
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
        <h2 className="font-serif text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
          Jaguarを知る
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ENCYCLOPEDIA_LINKS.map((item) => (
            <Card key={item.href} href={item.href}>
              <CardBody>
                <CardTitle>{item.title}</CardTitle>
                <CardMeta>{item.description}</CardMeta>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
