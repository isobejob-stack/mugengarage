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
  images: {
    remotePatterns: [supabaseStoragePattern()],
    // 車両写真は一眼で撮影された数MBのJPEGがそのまま登録されうる。AVIF/WebPへの自動変換で
    // 転送量を大きく削減する（AVIFは同等画質でJPEG比おおむね半分以下）。
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
