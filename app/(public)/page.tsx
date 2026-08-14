import type { Metadata } from "next";
import Image from "next/image";
import {
  listPublicVehicles,
  getLeadVehiclePhotoPaths,
} from "@/lib/inventory/queries";
import { getVehiclePhotoPublicUrl } from "@/lib/inventory/storage";
import { getSiteAssetPublicUrl } from "@/lib/settings/storage";
import { SITE_URL, siteNav } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings/queries";
import { LineConsultationMenu } from "@/components/layout/line-consultation-menu";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardImage,
  CardBody,
  CardTitle,
  CardMeta,
} from "@/components/ui/card";
import { VehicleFeatureBadges } from "@/components/ui/status-badge";
import { VehicleCardPrice } from "@/components/inventory/vehicle-price";
import { VehicleCardSpecs } from "@/components/inventory/vehicle-card-specs";
import { VehicleQuickSearch } from "@/components/inventory/vehicle-quick-search";
import { getVehicleSearchFacetOptions } from "@/lib/inventory/search";
import { FavoriteIconButton } from "@/components/engagement/favorite-icon-button";
import { getSessionId } from "@/lib/engagement/session";
import { listFavoriteVehicleIds } from "@/lib/engagement/queries";

// トップページは掲載中の車両をDBから取得しているため、静的生成されると車両を登録・公開しても
// 次回デプロイまでトップに出ない（最も目に付く画面で更新が反映されない状態になる）。
// リクエストごとに描画する（理由の詳細は app/(public)/blog/page.tsx のコメント参照）。
export const dynamic = "force-dynamic";

// トップページはルートlayoutのtitle.default（"エムガレージ｜クラシックJaguar専門店"）を
// そのまま使いたいため、titleは上書きせずcanonicalのみ明示する。
// トップは "/" と "" の両方で到達しうるため、正規URLを示しておく。
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

const TOP_PAGE_VEHICLE_LIMIT = 9;

// 「Jaguarを知る」配下の読み物。ヘッダーのナビゲーションと同じ定義を使い、
// トップページとヘッダーで項目がずれないようにする（lib/site-config.ts）。
const KNOWLEDGE_NAV = siteNav.find((item) => item.label === "Jaguarを知る");

// SCR-PUB-001: トップページ（FR-INV-005, FR-LINE-001, FR-SEO-001）
export default async function Page() {
  const sessionId = await getSessionId();
  const [vehicles, settings, facets, favoriteIds] = await Promise.all([
    listPublicVehicles(),
    getSiteSettings(),
    getVehicleSearchFacetOptions(),
    sessionId ? listFavoriteVehicleIds(sessionId) : Promise.resolve([]),
  ]);
  // トップに出す在庫の上限。3カラムのグリッドがちょうど3行で埋まる9台とする
  // （10台前後で打ち切る想定だが、9なら最終行に1台だけ余るような欠けが出ない）。
  // これを超える場合は「すべて見る」ボタンで在庫一覧へ送る。
  const featuredVehicles = vehicles.slice(0, TOP_PAGE_VEHICLE_LIMIT);
  const hasMoreVehicles = vehicles.length > TOP_PAGE_VEHICLE_LIMIT;

  // 在庫車両カードのサムネイル用に、トップ3件分のみ先頭写真を1クエリでまとめて取得する
  const leadPhotoPaths = await getLeadVehiclePhotoPaths(
    featuredVehicles.map((v) => v.id),
  );
  const featuredPhotoUrls = featuredVehicles.map((v) => {
    const path = leadPhotoPaths.get(v.id);
    return path ? getVehiclePhotoPublicUrl(path) : null;
  });

  const heroImageUrl = settings.hero_image_path
    ? getSiteAssetPublicUrl(settings.hero_image_path)
    : null;

  return (
    <main className="pb-8">
      {/* ヒーロー。管理画面で店舗写真が設定されていれば全幅の写真、未設定なら従来の文字ベース。
          クラシックJaguar専門店にとって車と店の佇まいが最も強い訴求材料であるため、
          写真がある場合は画面幅いっぱいに見せる。 */}
      {heroImageUrl ? (
        <section className="relative flex min-h-[60vh] items-end overflow-hidden sm:min-h-[70vh]">
          <Image
            src={heroImageUrl}
            alt="エムガレージの店舗とクラシックJaguar"
            fill
            // ファーストビューの主役でありLCPそのものなので、遅延読み込みを外す
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* 写真の明るさは差し替えのたびに変わるため、文字の可読性を写真任せにしない。
              下方向へ濃くなるスクリムを重ね、白文字とのコントラストを常に確保する（WCAG 1.4.3）。 */}
          <div
            className="from-charcoal-900 via-charcoal-900/70 to-charcoal-900/20 absolute inset-0 bg-gradient-to-t"
            aria-hidden="true"
          />
          <div className="relative mx-auto w-full max-w-5xl px-4 pb-12 sm:pb-16">
            <p className="text-accent-400 text-xs font-medium tracking-[0.15em] uppercase">
              Classic Jaguar Specialist
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-balance text-white sm:text-5xl">
              エムガレージ
            </h1>
            <p className="mt-4 max-w-2xl text-neutral-200">
              30年以上の実績を持つクラシックJaguar専門店。販売・整備・修理・買取・ご相談まで、Jaguarのことなら何でもお任せください。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/vehicles" variant="secondary" size="lg">
                在庫車両を見る
              </Button>
              {settings.line_url && (
                <Button href={settings.line_url} variant="line" size="lg">
                  LINEで相談する
                </Button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto max-w-5xl px-4 pt-8">
          <section className="bg-charcoal-900 shadow-medium rounded-2xl px-6 py-12 text-white sm:px-10 sm:py-16">
            <p className="text-accent-400 text-xs font-medium tracking-[0.15em] uppercase">
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
              {settings.line_url && (
                <Button href={settings.line_url} variant="line" size="lg">
                  LINEで相談する
                </Button>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4">
        {/* ヒーローの直後に検索ブロックを置く。
            この店に来た人の第一の用件は「車を探す」であり、
            その入口をスクロールさせずに渡す。 */}
        {vehicles.length > 0 && (
          <div className="mt-8">
            <VehicleQuickSearch
              models={facets.models}
              totalCount={vehicles.length}
            />
          </div>
        )}

        <section className="mt-10">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
            掲載中の車両
          </h2>
          {featuredVehicles.length === 0 ? (
            <p className="text-foreground-muted mt-4">
              現在公開中の車両はありません。
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {featuredVehicles.map((v, index) => {
                if (!v.slug) return null;
                // 車名は在庫一覧・お気に入り・ランキングと同じくグレードまで出す
                const vehicleName = [
                  v.manufacturers?.name,
                  v.models?.name,
                  v.grades?.name,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  // お気に入りボタンをカード（リンク）の外側に重ねるため、liを基準位置にする
                  <li key={v.id} className="relative">
                    <FavoriteIconButton
                      vehicleId={v.id}
                      initialFavorited={favoriteIds.includes(v.id)}
                      vehicleName={vehicleName}
                    />
                    <Card href={`/vehicles/${v.slug}`}>
                      <VehicleFeatureBadges
                        isRecommended={v.is_recommended}
                        isNewArrival={v.is_new_arrival}
                      />
                      {/* 先頭カードの写真はファーストビューに入りLCPになりやすいため、
                        遅延読み込みを外して表示を前倒しする（2枚目以降は遅延のまま） */}
                      <CardImage
                        src={featuredPhotoUrls[index] ?? undefined}
                        alt={vehicleName}
                        priority={index === 0}
                      />
                      <CardBody>
                        <CardTitle>{vehicleName}</CardTitle>
                        <VehicleCardPrice
                          price={v.price}
                          totalPrice={v.total_price}
                        />
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
                );
              })}
            </ul>
          )}

          {/* 掲載台数が上限を超えたら、続きは在庫一覧へ送る。
            従来は小さな文字リンクだったため見落としやすく、スマートフォンでは
            タップ領域も足りていなかった。ボタンとして明示する。 */}
          {hasMoreVehicles && (
            <div className="mt-6 flex justify-center">
              <Button href="/vehicles" variant="outline" size="lg">
                在庫車両をすべて見る（{vehicles.length}台）
              </Button>
            </div>
          )}
        </section>

        {/* FR-LINE-002: 相談カテゴリ表示（購入／修理／売却／部品／Jaguar全般／カーライフ相談） */}
        <div className="mt-10">
          <LineConsultationMenu lineUrl={settings.line_url} />
        </div>

        {KNOWLEDGE_NAV?.children && (
          <section className="mt-10">
            <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight sm:text-2xl">
              {KNOWLEDGE_NAV.label}
            </h2>
            <p className="text-foreground-muted mt-2">
              クラシックJaguarをより深く知るための読み物です。
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {KNOWLEDGE_NAV.children.map((item) => (
                <Card key={item.href} href={item.href}>
                  <CardBody>
                    <CardTitle>{item.label}</CardTitle>
                    <CardMeta>{item.description}</CardMeta>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
