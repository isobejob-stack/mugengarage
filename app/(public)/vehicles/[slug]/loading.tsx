// 車両詳細に入るあいだのスケルトン。
//
// 従来は app/(public)/loading.tsx（公開ページ共通）が使われていた。
// あれは「見出し＋カード6枚のグリッド」で、在庫一覧そのものとほぼ同じ見た目になる。
// 一覧で車をタップした人には、一覧から一覧風の骨組みへ変わっただけに見えるため、
// 「押したのに何も起きていない」と受け取られ、二度押しの原因になっていた。
//
// ここでは詳細ページの骨格（パンくず→車名→価格→大きな写真→主要諸元）を返す。
// 到着先の形が最初のフレームから分かれば、待っているあいだも
// 「今この車のページを開いている」と伝わる。
//
// 実データとの位置ズレを小さくするため、写真は詳細ページのギャラリーと同じ4:3、
// 諸元は同じ2列（sm以上で4列）のグリッドに合わせてある。
export default function Loading() {
  return (
    <main
      className="mx-auto max-w-3xl px-4 py-8 pb-24 sm:pb-28"
      aria-busy="true"
    >
      {/* 視覚的なスケルトンは読み上げに乗らないため、状態は文言でも通知する */}
      <p className="sr-only" role="status">
        車両情報を読み込んでいます
      </p>

      <div aria-hidden="true">
        {/* パンくず相当 */}
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />

        {/* ステータスバッジ相当 */}
        <div className="mt-4 h-6 w-20 animate-pulse rounded-full bg-neutral-200" />

        {/* 車名（h1）相当 */}
        <div className="mt-3 h-9 w-4/5 animate-pulse rounded-lg bg-neutral-200" />

        {/* 価格相当。詳細ページで最初に目が行く場所なので幅を広めに取る */}
        <div className="mt-3 h-10 w-2/3 max-w-xs animate-pulse rounded-lg bg-neutral-200" />

        {/* 主要諸元4項目（年式・走行距離・車検・修復歴）相当 */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-cream-100 rounded-xl border border-neutral-200 px-3 py-2.5"
            >
              <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
              <div className="mt-1.5 h-5 w-16 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>

        {/* お気に入り・LINE相談のボタン相当 */}
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="h-11 w-36 animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-11 w-48 animate-pulse rounded-lg bg-neutral-200" />
        </div>

        {/* 写真ギャラリー相当。この画面の主役なので大きく取る */}
        <div className="mt-8 aspect-[4/3] w-full animate-pulse rounded-2xl bg-neutral-200" />

        {/* 本文（この車の魅力・販売コメント等）相当 */}
        <div className="mt-8 space-y-3">
          <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </main>
  );
}
