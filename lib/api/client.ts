// クライアント側からAPIを叩くときの共通ヘルパ。
//
// 背景: 画面側の fetch がどこも try/catch で囲われておらず、通信自体が失敗したとき
// （オフライン・電波断・タイムアウト・DNS失敗）に fetch が reject し、送信ハンドラを
// 抜けてしまっていた。その結果、
//   - 送信中フラグを false に戻す処理に到達せず、ボタンが「送信中...」のまま固まる
//   - エラーメッセージも表示されないため、利用者は何が起きたか分からない
//   - 入力内容を保ったまま復帰する手段が無く、リロード＝やり直しになる
// という壊れ方をしていた。屋外での車両登録や、スマートフォンからの問い合わせ送信という
// 実際の利用場面で最も起きやすい種類の失敗であるため、共通化して確実に握りつぶす。

export type ApiSuccess<T> = { ok: true; data: T };
// status: HTTPステータス。409（競合）など、状況によって文言や挙動を変えたい呼び出し側が使う。
// 通信自体が成立しなかった場合はレスポンスが存在しないため undefined になる。
export type ApiFailure = {
  ok: false;
  message: string;
  field?: string;
  status?: number;
};
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

// 通信そのものが成立しなかったときの文言。技術用語を避け、次に取るべき行動を示す。
const NETWORK_ERROR_MESSAGE =
  "通信に失敗しました。電波状況をご確認のうえ、もう一度お試しください。";
const UNEXPECTED_ERROR_MESSAGE =
  "予期しないエラーが発生しました。時間をおいて再度お試しください。";

async function request<T>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<ApiResult<T>> {
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // ネットワーク到達不能。例外を外に出さず、必ず結果として返す。
    return { ok: false, message: NETWORK_ERROR_MESSAGE };
  }

  if (!response.ok) {
    // エラー応答のJSONが壊れていても落ちないようにする（502等でHTMLが返る場合がある）
    const errorBody = await response.json().catch(() => null);
    return {
      ok: false,
      message: errorBody?.error?.message ?? UNEXPECTED_ERROR_MESSAGE,
      field: errorBody?.error?.field,
      status: response.status,
    };
  }

  // 204 No Content 等、本文が無い応答でも壊れないようにする
  const data = await response.json().catch(() => null);
  return { ok: true, data: data?.data ?? data };
}

// 新規作成と更新で同じフォームを使い回す画面（isEdit ? "PATCH" : "POST"）向けに、
// メソッドを引数で受け取れる形も用意する。
export function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  return request<T>(url, method, body);
}

export function postJson<T = unknown>(url: string, body?: unknown) {
  return request<T>(url, "POST", body);
}

export function patchJson<T = unknown>(url: string, body?: unknown) {
  return request<T>(url, "PATCH", body);
}

export function deleteJson<T = unknown>(url: string, body?: unknown) {
  return request<T>(url, "DELETE", body);
}
