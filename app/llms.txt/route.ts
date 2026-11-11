import { createAdminClient } from "@/lib/supabase/admin";
import { attachVehicleSlugs } from "@/lib/inventory/queries";
import { getSiteSettings } from "@/lib/settings/queries";
import { buildLlmsTxt, type LlmsVehicle } from "@/lib/seo/llms";

// AI向けの案内書き（lib/seo/llms.ts）。
//
// ビルド時に作らずリクエストごとに組み立てる。サイトマップと同じく、ビルド時にDBへつなぐと
// 環境変数の不足や一時的な障害だけでデプロイ全体が止まるため（app/sitemap.ts のコメント参照）。
// 読まれる回数は少なく、店舗情報はキャッシュ済みなので、毎回組み立てても負荷は小さい。
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings();

  // 在庫が読めなくても、店舗情報だけの案内書きは返す
  let vehicles: LlmsVehicle[] = [];
  try {
    const { data } = await createAdminClient()
      .from("vehicles")
      .select(
        "id, price, total_price, model_year, mileage_km, accident_history, steering_side, sales_comment, manufacturers(name), models(name)",
      )
      .eq("status", "published")
      .is("deleted_at", null)
      .order("display_order", { ascending: true });
    vehicles = await attachVehicleSlugs(
      (data ?? []) as unknown as Array<
        Omit<LlmsVehicle, "slug"> & { id: string }
      >,
    );
  } catch (error) {
    console.error("[llms.txt] 在庫の取得に失敗しました", error);
  }

  return new Response(
    buildLlmsTxt({ settings, vehicles, generatedAt: new Date() }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // CDNで1時間まで使い回す（在庫の入れ替えは1日に何度もない）
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
