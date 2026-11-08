import { AdminLoginForm } from "@/components/admin/login-form";

// SCR-ADM-001: 管理者ログイン。
//
// `?notice=not_admin` は、ログインはできたが admin_users に登録がない人を
// 保護レイアウトから送ってきたときに付く（app/admin/(protected)/layout.tsx）。
// 入力欄の状態を持つフォーム本体はクライアント側にあるため、
// クエリの読み取りだけをこのサーバー側で行って渡す。
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;

  return <AdminLoginForm notice={notice} />;
}
