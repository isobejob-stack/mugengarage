// 旧URL（Vercelの発行URL）から独自ドメインへの恒久転送（2026-11-16、ISSUE-003）。
//
// 背景: 「mugengarage」で調べるとこのサイトが並ぶのに、「エムガレージ」では出てこない。
// 「mugengarage」はこのサイトしか使っていない文字列なので、それで探せば当然出る。
// 「エムガレージ」で出ないのは、Googleがこのサイトを知ってから日が浅く（Search Console 登録は 2026-11-11）、
// 「このサイトがエムガレージの公式サイトだ」と示す外部のリンク（Googleビジネスプロフィール・
// 掲載媒体・Instagram）がまだ無いため。ドメイン名そのものが原因ではない。
//
// ただし独自ドメインへの移行（ISSUE-003）は、これから外部のリンクを張っていく前に済ませたい。
// 先に旧URLで張ると、移行時に全部を張り替えることになり、その間に積み上がった評価も引っ越しになる。
//
// 移行のときは Vercel の環境変数 NEXT_PUBLIC_SITE_URL を新しいドメインに変えるだけでよい。
// その値が旧URLと違えば、旧URLへのアクセスをすべて同じパスのまま新しいドメインへ転送する。
// 検索エンジンは恒久転送（308。301と同じ扱い）を見て、旧URLの評価を新しいドメインへ引き継ぐ。
//
// next.config.ts から読むため、ここでは "@/..." の別名や server-only を使わない。

/** これまでの本番URLのホスト。Search Console・掲載媒体に登録済みのURLはこれ */
export const LEGACY_PRODUCTION_HOST = "mugengarage.vercel.app";

export type LegacyHostRedirect = {
  source: string;
  has: { type: "host"; value: string }[];
  destination: string;
  permanent: true;
};

export function buildLegacyHostRedirects(
  siteUrl: string | undefined,
): LegacyHostRedirect[] {
  if (!siteUrl) return [];

  let target: URL;
  try {
    target = new URL(siteUrl);
  } catch {
    // 不正な値でビルドを止めない（next.config.ts の supabaseStoragePattern と同じ方針）
    return [];
  }
  // まだ旧URLのまま＝移行前。転送すると自分自身へのループになる
  if (target.host === LEGACY_PRODUCTION_HOST) return [];

  return [
    {
      // 転送しないもの:
      // - /api … Vercel の定期処理（Cron）は転送をたどらないため、旧URLに届いた定期処理が転送で止まってしまう。
      //   /api は robots.txt で検索の対象外なので、評価の引き継ぎにも関係しない
      // - Search Console の確認ファイル（public/google….html）… 旧URLの登録（プロパティ）は移行後も
      //   「アドレス変更」の届け出と引き継ぎの確認に使う。確認ファイルまで転送すると、旧URLの所有権の確認が通らなくなる
      source: "/:path((?!api/|google[0-9a-f]+\\.html$).*)",
      // 値は正規表現として前後一致で比べられる。「.」を任意の1文字にしないよう逃がす
      has: [
        { type: "host", value: LEGACY_PRODUCTION_HOST.replace(/\./g, "\\.") },
      ],
      destination: `${target.origin}/:path`,
      permanent: true,
    },
  ];
}
