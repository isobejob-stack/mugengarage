import "server-only";
import { cookies } from "next/headers";

// FR-FAV-001: 匿名セッションID（proxy.tsのミドルウェアで発行済み）を読み取る。
// 発行前の初回リクエストでは未確定のためnullを返す（お気に入りボタンは未選択状態で表示される）。
export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get("mg_session_id")?.value ?? null;
}
