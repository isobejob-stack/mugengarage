import { LiveEditor } from "@/components/live-edit/live-editor";

// SCR-ADM-025（新設）: 公開画面を見ながら直す
//
// 発注者の要望（2026-08-16）:
// 「管理画面で、本番画面を見ながら直接編集できるようなUIにしてほしい。
//   今だと項目ごとに判断して整理するしかないので工数負荷が大きい。
//   本番環境上ではなく、管理画面でログインしながら仮想の本番画面を全て操作できるイメージ」
//
// 実体は公開サイトそのものをiframeで出しているため、「仮想の本番画面」ではなく
// 本物の公開画面が出る。ただし編集用の目印は、この画面を開いている管理者にしか付かない
// （lib/live-edit/context.ts: 編集用Cookie + 管理者ログインの両方が必要）。
export default function Page() {
  return (
    <main className="mx-auto max-w-[110rem] px-4 py-6">
      <div className="mb-4">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          公開画面を見ながら直す
        </h1>
        <p className="text-foreground-muted mt-1 text-base">
          左がお客様に見えている画面です。直したい場所をクリックすると、右に入力欄が出ます。
        </p>
      </div>
      <LiveEditor />
    </main>
  );
}
