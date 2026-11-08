// 問い合わせ用のメールリンク（mailto:）を組み立てる。
//
// 件名と本文の書き出しを入れておくと、どの車・どのページからの問い合わせかを
// お客様が書き忘れても店側で分かる（車両詳細では件名に車名、本文にページのURLを入れる）。
// URLSearchParams は空白を「+」にするが、メールアプリによっては「+」がそのまま表示されるため %20 にする。
export function buildMailtoUrl(
  email: string,
  subject?: string,
  body?: string,
): string {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString().replace(/\+/g, "%20");
  return `mailto:${email}${query ? `?${query}` : ""}`;
}
