import Link from "next/link";

// SCR-PUB-019: 404ページ（error_response.md 6章）
// 車両が売約済・削除された可能性を案内し、離脱を防ぐ導線を提示する。
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-8 text-center">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <p className="mt-4 text-neutral-600">
        お探しの車両は、売約済または非公開になっている可能性があります。
      </p>
      <div className="mt-6 flex gap-4">
        <Link href="/" className="underline">
          トップページへ
        </Link>
        <Link href="/vehicles" className="underline">
          在庫一覧を見る
        </Link>
      </div>
    </main>
  );
}
