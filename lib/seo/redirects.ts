import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// BR-URL-002 / event_flow.md 3.7: 旧URL→新URLの301リダイレクトを自動登録する。
// Slug変更のたびに必ずこの関数を通すことで、Redirect作成を運用者の手動操作に依存させない
// （event_flow.md 4章「Slug変更とRedirect作成は同一操作内で必ずセットで発生させる」）。
//
// A→B→Cのように複数回Slugが変わるケース（old_pathのunique制約）に対応するため、
// 1) oldPathを指していた既存のリダイレクトは、多段リダイレクトを避けるためnewPathへ直接付け替える
// 2) newPathがかつて別コンテンツのold_pathとして登録されていた場合、newPathは今や実体のある
//    URLになっているため、その古いリダイレクトは削除する（リダイレクトループの防止）
// 3) old_path -> new_path をupsertする（old_pathのunique制約に対するエラーハンドリング）
export async function createRedirect(oldPath: string, newPath: string) {
  if (oldPath === newPath) return;

  const supabase = createAdminClient();

  await supabase
    .from("redirects")
    .update({ new_path: newPath })
    .eq("new_path", oldPath);

  await supabase.from("redirects").delete().eq("old_path", newPath);

  const { error } = await supabase
    .from("redirects")
    .upsert(
      { old_path: oldPath, new_path: newPath },
      { onConflict: "old_path" },
    );

  if (error) {
    // リダイレクト作成の失敗でコンテンツ本体の更新自体を失敗させたくないため、ログのみ残す。
    // （旧URLへのアクセスは404になるだけで、コンテンツの整合性自体は損なわれない）
    console.error("[seo] failed to create redirect", {
      oldPath,
      newPath,
      error,
    });
  }
}
