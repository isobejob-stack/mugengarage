import { createBrowserClient } from "@supabase/ssr";

// ブラウザ（Client Component）から呼び出すSupabaseクライアント。
// 管理系のデータ変更は必ずAPI Route/Server Actions経由で行い、
// ここから直接テーブルを書き換えない（coding_standards.md 4章）。
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
