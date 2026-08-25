import type { NextConfig } from "next";

// 車両写真はSupabase Storageの公開URLで配信しているため、next/imageで最適化するには
// 配信元ホストを明示的に許可する必要がある（Next.js 16では images.domains は廃止され
// remotePatterns に一本化された。node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md）。
//
// NEXT_PUBLIC_SUPABASE_URL からホスト名を導出するが、この値はビルド環境に無いこともある。
// ここで例外を投げるとビルドが落ち、「環境変数の設定漏れでデプロイ全体が止まる」という
// 以前直した問題を再発させてしまうため、未設定・不正時は Supabase の共通ドメインに
// フォールバックする（`*` はサブドメイン1階層にマッチする）。
function supabaseStoragePattern() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (configuredUrl) {
    try {
      return {
        protocol: "https" as const,
        hostname: new URL(configuredUrl).hostname,
        pathname: "/storage/v1/object/public/**",
      };
    } catch {
      // 不正なURLが入っていてもビルドは止めず、フォールバックに任せる
    }
  }

  return {
    protocol: "https" as const,
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  };
}

const nextConfig: NextConfig = {
  // 整備実績（/maintenance-records）はブログへ統合し、ページごと削除した（2026-08-17）。
  // 旧URLをそのまま404にすると、これまでの被リンクと検索流入を捨てることになるため、
  // ブログ一覧へ恒久リダイレクトする。
  //
  // 詳細ページ（:slug）の行き先もあえて一覧にしている。移行後の記事slugは
  // 記事側と衝突した場合に 'maintenance-' が前置されうるため、旧slugから
  // 新URLを機械的に導けない。存在しない記事へ飛ばして404を見せるより、
  // カテゴリ「整備記録」で絞り込める一覧に着地させる方が読者は目的に近づける。
  //
  // permanent: true は Next.js では 301 ではなく 308 を返す（リクエストメソッドを保つため）。
  // 検索エンジンにとっては301と同じ「恒久的な移動」として扱われる
  // （node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md）。
  redirects() {
    return [
      { source: "/maintenance-records", destination: "/blog", permanent: true },
      {
        source: "/maintenance-records/:slug",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [supabaseStoragePattern()],
    // 車両写真は一眼で撮影された数MBのJPEGがそのまま登録されうる。AVIF/WebPへの自動変換で
    // 転送量を大きく削減する（AVIFは同等画質でJPEG比おおむね半分以下）。
    formats: ["image/avif", "image/webp"],
    // 最適化済み画像の保持期間を31日にする（Next.js 16の既定は4時間）。
    //
    // 保存先のオブジェクトキーはアップロードごとに生成するUUIDで、
    // 写真を差し替えれば必ず別のURLになる（lib/inventory/storage.ts,
    // lib/settings/storage.ts）。同じURLの中身が変わることはないため、
    // 長く持たせても古い写真が出続ける事故が起きない。
    //
    // この値は最適化結果のキャッシュ寿命であると同時に、配信時の Cache-Control の
    // max-age としてCDNとブラウザにもそのまま渡る。在庫一覧は1ページに数十枚の
    // 写真が並ぶ画面なので、再訪・回遊のたびに取り直させないことの効きが大きい。
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
};

export default nextConfig;
