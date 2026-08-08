import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Route Handlers / Server Actions専用。SUPABASE_SERVICE_ROLE_KEYはRLSをbypassするため、
// このモジュールはサーバー側からのみimportできる（"server-only"がクライアントバンドルへの
// 混入をビルド時に検出する）。公開/管理の認可判定はAPI層でのセッション検証に一本化し、
// テーブル単位のRLSポリシー設計は行わない（docs/tasks/ISSUE-002-rls-policies-undefined.md）。
// 環境変数が未設定のまま createSupabaseClient を呼ぶと "supabaseUrl is required." という
// どの変数が足りないのか分からないエラーになり、Vercelのビルドログから原因を特定しづらい。
// どの環境変数が未設定なのかを名指しし、設定先（Vercelのプロジェクト設定）まで示して落とす。
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `環境変数 ${name} が未設定です。Vercel の Project Settings > Environment Variables で、` +
        `対象の環境（Production / Preview / Development）すべてに設定してください（.env.example 参照）。`,
    );
  }
  return value;
}

export function createAdminClient() {
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
