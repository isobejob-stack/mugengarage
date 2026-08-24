import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// 旧URL→新URLの引き当て（BR-URL-002 / event_flow.md 3.7）を、
// リクエストごとのDBアクセスなしで行うための小さなインメモリキャッシュ。
//
// 従来 proxy.ts は公開ページへのアクセス1回ごとに redirects テーブルへ
// 「この pathname は旧URLか？」を問い合わせていた。ほぼ全てのアクセスは
// 現行URL宛て＝空振りなので、サイトの全アクセスに Supabase 1往復ぶんの
// 待ち時間を上乗せしているだけになっていた。Next.js の Proxy は
// 「遅いデータ取得のための場所ではない」と明示されている
// （node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md）。
//
// redirects は「slugを変えたとき1行増える」テーブルで、実運用では多くて数百行。
// 全件をメモリに持ち、TTLで取り直す方が、引き当ての精度を落とさずに桁違いに速い。
//
// 注意（インスタンス単位のキャッシュ）:
// Vercelのサーバーレス実行ではプロセスごとに独立し、寿命も保証されない。
// そのためこれは「あると速い」層で、最悪でも TTL 経過後には必ず最新へ追いつく。
// 逆に言えば、slug変更直後の最大 TTL 秒だけ旧URLが404になりうる。
// リダイレクトの受け手は検索エンジンのクロールと既存の被リンクで、
// いずれも秒単位の即時性を要求しないため、この遅れは許容できる。
const TTL_MS = 60_000;

// 読み込みに失敗したときに、次の再挑戦までは待つ時間。
// 失敗をそのまま素通しすると、DB障害のあいだ全アクセスが毎回読み込みを試みることになり、
// 落ちている相手を叩き続けたうえに、その待ち時間が全ページに乗ってしまう。
const RETRY_MS = 5_000;

// Next.js Proxy は Node.js ランタイムで動くため、モジュールスコープの状態を保持できる
// （Next.js 16: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md）。
let cached: { map: Map<string, string>; expiresAt: number } | null = null;
let inFlight: Promise<Map<string, string>> | null = null;

async function loadRedirectMap(): Promise<Map<string, string>> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("redirects")
    .select("old_path, new_path");

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [row.old_path as string, row.new_path as string]),
  );
}

async function getRedirectMap(): Promise<Map<string, string>> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.map;
  }

  // 同時に来た複数のリクエストで同じ読み込みを重ねない
  inFlight ??= loadRedirectMap()
    .then((map) => {
      cached = { map, expiresAt: Date.now() + TTL_MS };
      return map;
    })
    .catch((error) => {
      console.error("[seo] failed to load redirects", error);
      // 読み込みに失敗しても、直前まで持っていた内容があればそれを使い続ける。
      // 一時的なDB障害でリダイレクトが全部404になる方が実害が大きい。
      const fallback = cached?.map ?? new Map<string, string>();
      cached = { map: fallback, expiresAt: Date.now() + RETRY_MS };
      return fallback;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function findRedirect(pathname: string): Promise<string | null> {
  const map = await getRedirectMap();
  return map.get(pathname) ?? null;
}

// 旧URLを登録した直後に呼ぶと、TTLを待たずに次の引き当てから反映される。
//
// 保持している内容は捨てずに期限切れとして印を付ける。捨ててしまうと、
// 直後の読み直しがDB障害で失敗したときに戻る先が無くなり、
// 「取り直しを促しただけで全リダイレクトが404になる」ことになるため。
export function invalidateRedirectCache() {
  if (cached) cached.expiresAt = 0;
}
