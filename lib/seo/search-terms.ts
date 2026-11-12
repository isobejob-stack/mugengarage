// 検索で使われる言葉に、ページのタイトルを寄せるための小さな関数（2026-11-12）。
//
// 探す人は「ジャガー eタイプ」「ジャガー 旧車 XJ」のように、車名の前に「ジャガー」を付けて検索する。
// 図鑑の項目名は「Eタイプ」「XJ40」のように車名だけなので、そのままでは
// 「ジャガー」で探した人に、どのメーカーの話かがタイトルで伝わらない。

// 項目名がすでにメーカーを名乗っているか。ディムラーの車（ダブルシックス等）に「ジャガー」を付けると誤りになる
const MAKER_PATTERN =
  /ジャガー|jaguar|ディムラー|デイムラー|ダイムラー|daimler|ダブルシックス|double.?six/i;

/** 図鑑の項目のページタイトル: 「Eタイプ」→「ジャガー Eタイプ｜ジャガー図鑑」 */
export function encyclopediaPageTitle(title: string): string {
  const name = MAKER_PATTERN.test(title) ? title : `ジャガー ${title}`;
  return `${name}｜ジャガー図鑑`;
}

/** 用語ライブラリのページタイトル: 「SUキャブレター」→「SUキャブレターとは｜ジャガー用語ライブラリ」 */
export function libraryPageTitle(term: string): string {
  const name = /とは$/.test(term) ? term : `${term}とは`;
  return `${name}｜ジャガー用語ライブラリ`;
}
