import "server-only";

// 公開バケットのオブジェクトURLを、Supabaseクライアントを作らずに組み立てる。
//
// これまで表示側は写真1枚ごとに createAdminClient().storage.getPublicUrl() を呼んでいた。
// getPublicUrl 自体は文字列を組み立てるだけの同期処理だが、その手前で毎回
// Supabaseクライアント一式（Auth / Postgrest / Realtime / Storage）を新規に生成していた。
// 在庫一覧は1ページに最大20台×5枚＝100枚ぶん並ぶため、URLを作るためだけに
// クライアントを100個作って捨てる状態になっていた。
//
// 組み立て規則は @supabase/storage-js の getPublicUrl と同じ:
//   encodeURI(`<supabaseUrl>/storage/v1/object/public/<bucket>/<path>`)
// （node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts）。
// バケットは public 指定で作成済みのため署名は不要。
function storageBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "環境変数 NEXT_PUBLIC_SUPABASE_URL が未設定です。Vercel の Project Settings > Environment Variables で、" +
        "対象の環境（Production / Preview / Development）すべてに設定してください（.env.example 参照）。",
    );
  }

  return `${supabaseUrl.trim().replace(/\/+$/, "")}/storage/v1`;
}

export function getStoragePublicUrl(bucket: string, storagePath: string) {
  // 先頭のスラッシュは storage-js 側でも落としている（`//` になると別パス扱いになるため）
  const normalizedPath = storagePath.replace(/^\/+/, "");
  return encodeURI(
    `${storageBaseUrl()}/object/public/${bucket}/${normalizedPath}`,
  );
}
