import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// ライブ編集モードが有効かどうかの判定。
//
// 有効条件は2つ。**両方**が必要。
//   1. ライブ編集用のCookieが立っている（管理画面のライブ編集画面が付ける）
//   2. 管理者としてログインしている
//
// Cookieだけで有効にしないのは、来店客のブラウザに何かの拍子でCookieが残っても
// 編集用の目印が公開サイトに出ないようにするため。逆に、ログインしているだけでも
// 有効にしないのは、店主が普通に自分のサイトを見ているときに編集の枠線が出ると
// 「お客さんに見えている画面」を確認できなくなるため。
//
// 公開ページのあちこちから呼ばれるので、React の cache() で
// 1リクエスト1回に抑える（毎回 Supabase の認証確認をするとページが遅くなる）。
export const LIVE_EDIT_COOKIE = "mg_live_edit";

export const isLiveEditEnabled = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  if (cookieStore.get(LIVE_EDIT_COOKIE)?.value !== "1") return false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    // 認証の確認に失敗したときは「編集モードではない」に倒す。
    // 公開サイトの表示を止めないことを優先する。
    return false;
  }
});
