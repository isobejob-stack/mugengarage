"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// エラー境界が1つも無く、DBの不調やネットワーク障害でページが例外を投げると
// Next.jsの既定エラー画面がそのまま見込み客に表示される状態だった。
// 公開ページは全てリクエストごとにDBを読むため（force-dynamic）、この経路は現実に起こりうる。
//
// 単に「エラーです」で終わらせず、再試行とLINE相談への導線を残す。
// 在庫を探しに来た客をここで取りこぼさないことが目的（LINE相談は最重要CTA / FR-LINE-001）。
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Vercelのランタイムログに出して、発生に気付けるようにする
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
      <h1 className="text-charcoal-900 font-serif text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        ページを表示できませんでした
      </h1>
      <p className="text-foreground-muted mt-4">
        一時的な不具合が発生しています。お手数ですが、少し時間をおいて再度お試しください。
        お急ぎの場合はLINEからお気軽にご相談ください。
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset} variant="primary" size="lg">
          再読み込みする
        </Button>
        <Button href="/" variant="outline" size="lg">
          トップページへ
        </Button>
      </div>

      {/* 問い合わせ時に状況を特定できるよう、Next.jsが付与するエラーIDのみ控えめに表示する。
          例外の内容そのものは利用者に見せない（内部情報の露出を避ける）。 */}
      {error.digest && (
        <p className="text-foreground-muted mt-8 font-mono text-sm">
          エラーID: {error.digest}
        </p>
      )}
    </main>
  );
}
