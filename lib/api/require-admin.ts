import "server-only";
import { createClient } from "@/lib/supabase/server";

// 管理系Route Handlerの入口で必ず呼ぶ。フロント側の画面制御だけに頼らず、
// リクエストごとにセッションを検証する（authentication.md 8章）。
export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
