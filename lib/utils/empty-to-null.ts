// 入力欄が空のときに、空文字ではなく null をフォームの値にするための変換。
//
// react-hook-form の register(name, { setValueAs }) に渡して使う。
//
// なぜ必要か:
// HTMLの <select> や <input> は「未選択・未入力」を空文字("")で表す。一方DBの列は
// null許容であり、zodスキーマも `z.enum([...]).nullable()` や `z.string().nullable()` で定義している。
// 空文字のまま流すと次の2種類の壊れ方をする。
//
// 1. `z.enum([...]).nullable()` は "" を通さない。したがって「未設定」を選び直しただけで
//    フォーム全体の検証に失敗し、保存ボタンを押しても何も起きない状態になる。
//    しかもエラーはその欄に紐づいて表示されないと、利用者からは原因がまったく見えない。
// 2. `date` 型の列に "" を送るとPostgresが構文エラーを返す（invalid input syntax for type date）。
//    検証は通るのに保存時だけ失敗する、という分かりにくい形で表面化する。
//
// 「未入力」を1箇所で null に寄せることで、この2つをまとめて塞ぐ。
export function emptyToNull(value: unknown): unknown {
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}
