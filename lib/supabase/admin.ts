import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Route Handlers / Server Actions専用。SUPABASE_SERVICE_ROLE_KEYはRLSをbypassするため、
// このモジュールはサーバー側からのみimportできる（"server-only"がクライアントバンドルへの
// 混入をビルド時に検出する）。公開/管理の認可判定はAPI層でのセッション検証に一本化し、
// テーブル単位のRLSポリシー設計は行わない（docs/tasks/ISSUE-002-rls-policies-undefined.md）。
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
