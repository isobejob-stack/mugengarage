// 公開ページは全てリクエストごとにDBを読む（force-dynamic）ため、応答が返るまでのあいだ
// 画面が前のページのまま無反応に見えていた。リンクを押しても何も起きないように感じられ、
// 二度押しや離脱を招く。
//
// このファイルを置くと、公開ページ配下の遷移中に即座にこのスケルトンが表示される。
// 「押した操作は受け付けられている」ことが即座に伝わることが目的なので、
// 実際のレイアウトを厳密に再現するのではなく、見出し＋カード群という共通の骨格だけを示す。
export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" aria-busy="true">
      {/* スクリーンリーダー利用者には視覚的なスケルトンが伝わらないため、状態を文言で通知する */}
      <p className="sr-only" role="status">
        読み込み中です
      </p>

      {/* 見出し相当 */}
      <div
        className="h-9 w-2/3 max-w-sm animate-pulse rounded-lg bg-neutral-200 sm:h-11"
        aria-hidden="true"
      />
      <div
        className="mt-4 h-5 w-full max-w-md animate-pulse rounded bg-neutral-200"
        aria-hidden="true"
      />

      {/* カード群相当。件数は「複数件が並ぶ」と伝われば十分なため6件に固定する */}
      <div
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="shadow-soft overflow-hidden rounded-2xl border border-neutral-200 bg-white"
          >
            {/* 画像領域。CardImageと同じ4:3にしておくと、実データ描画時のズレが小さい */}
            <div className="aspect-[4/3] w-full animate-pulse bg-neutral-200" />
            <div className="space-y-3 p-6">
              <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
