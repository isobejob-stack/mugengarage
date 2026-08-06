import { listAuditLogs } from "@/lib/audit/log";
import type { AuditAction } from "@/lib/audit/types";

// FR-ADM-005: 操作日時・操作者・操作対象（種別・ID）・アクション種別を一覧表示する。
// audit_logsは追記専用の観測ログであり、編集・削除機能は持たず一覧表示のみ行う。

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "作成",
  update: "更新",
  delete: "削除",
  publish: "公開",
  unpublish: "非公開",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  vehicle: "車両",
  vehicle_photo: "車両写真",
  vehicle_video: "車両動画",
  article: "記事",
  encyclopedia_entry: "図鑑項目",
  library_entry: "ライブラリ項目",
  timeline_event: "年表イベント",
  maintenance_record: "整備実績",
  owner_archive_entry: "オーナーズアーカイブ",
  customer: "顧客",
  customer_note: "顧客メモ",
  reminder: "リマインダー",
  inquiry: "問い合わせ",
};

function targetTypeLabel(targetType: string) {
  return TARGET_TYPE_LABELS[targetType] ?? targetType;
}

export default async function Page() {
  const logs = await listAuditLogs();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">監査ログ</h1>
      <p className="mt-2 text-sm text-neutral-500">SCR-ADM-023 ・ FR-ADM-005</p>

      {logs.length === 0 ? (
        <p className="mt-8 text-neutral-500">監査ログはまだありません。</p>
      ) : (
        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="py-2 pr-4 font-medium">操作日時</th>
              <th className="py-2 pr-4 font-medium">操作者</th>
              <th className="py-2 pr-4 font-medium">操作対象</th>
              <th className="py-2 font-medium">アクション</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-neutral-200">
                <td className="py-2 pr-4 text-neutral-500">
                  {new Date(log.created_at).toLocaleString("ja-JP")}
                </td>
                <td className="py-2 pr-4">
                  {log.admin_users?.name ?? "不明なユーザー"}
                </td>
                <td className="py-2 pr-4 font-mono">
                  {targetTypeLabel(log.target_type)} / {log.target_id}
                </td>
                <td className="py-2">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
