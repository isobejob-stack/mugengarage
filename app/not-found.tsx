import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// SCR-PUB-019: 404ページ（error_response.md 6章）
//
// このファイルは app/layout.tsx 直下で描画されるため、
// app/(public)/layout.tsx のヘッダー・フッターが適用されない。
// 検索から古いURLに着地した人に、ロゴもナビも店舗情報も無い白い画面を見せることになるので、
// ここで明示的に共通レイアウトを入れる。
//
// 文言は「車両が売約済」だけを想定していたが、実際には車両以外のURLでも到達する。
// どちらの場合にも噛み合う書き方にしたうえで、行き止まりにせず在庫へ送る。
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          ページが見つかりません
        </h1>
        <p className="text-foreground-muted mt-4 text-base">
          ページが移動または削除された可能性があります。
          お探しの車両が売約済みになっている場合もございます。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/vehicles" variant="primary" size="lg">
            在庫車両を見る
          </Button>
          <Button href="/" variant="outline" size="lg">
            トップページへ
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
