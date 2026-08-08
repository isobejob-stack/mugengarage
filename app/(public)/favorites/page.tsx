import { getSessionId } from "@/lib/engagement/session";
import { getPublicFavoriteVehicles } from "@/lib/engagement/queries";
import { Card, CardBody, CardTitle, CardMeta, CardPrice } from "@/components/ui/card";

// SCR-PUB-004: お気に入り一覧（匿名セッションIDに紐づく車両を表示、FR-FAV-002）
export default async function Page() {
  const sessionId = await getSessionId();
  const vehicles = sessionId ? await getPublicFavoriteVehicles(sessionId) : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        お気に入り一覧
      </h1>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-foreground-muted">
          お気に入り登録した車両はまだありません。車両詳細ページの「お気に入りに登録」から追加できます。
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {vehicles.map((v) =>
            v.slug ? (
              <li key={v.id}>
                <Card href={`/vehicles/${v.slug}`}>
                  <CardBody>
                    <CardTitle>
                      {v.manufacturers?.name} {v.models?.name}
                      {v.model_year ? `（${v.model_year}年）` : ""}
                    </CardTitle>
                    {v.mileage_km !== null && (
                      <CardMeta>
                        走行距離 {v.mileage_km.toLocaleString()}km
                      </CardMeta>
                    )}
                    <CardPrice>¥{v.price.toLocaleString()}</CardPrice>
                  </CardBody>
                </Card>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </main>
  );
}
