import { listAuditLogs, type AuditLogListItem } from "@/lib/audit/log";
import type { AuditAction } from "@/lib/audit/types";
import { Card } from "@/components/ui/card";

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

// レビュー指摘対応（必須修正3, BR-HIST-002）: Vercel Cron Jobsによる公開予約の自動公開
// （app/api/cron/publish-scheduled/route.ts）は actor_type = 'system' ・ admin_user_id = null
// で記録されるため、管理者操作と区別できるよう表示を分ける。
function actorLabel(log: AuditLogListItem) {
  if (log.actor_type === "system") {
    return "システム（自動公開）";
  }
  return log.admin_users?.name ?? "不明なユーザー";
}

export default async function Page() {
  const logs = await listAuditLogs();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        監査ログ
      </h1>
      <p className="mt-2 text-base text-foreground-muted">
        SCR-ADM-023 ・ FR-ADM-005
      </p>

      {logs.length === 0 ? (
        <p className="mt-8 text-base text-foreground-muted">
          監査ログはまだありません。
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm text-foreground-muted sm:hidden">
            → 表は横にスクロールできます
          </p>
          <Card className="mt-2 sm:mt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base">
              <thead>
                <tr className="border-b border-neutral-200 bg-cream-50 text-left text-foreground-muted">
                  <th className="py-3 pl-4 pr-4 font-semibold">操作日時</th>
                  <th className="py-3 pr-4 font-semibold">操作者</th>
                  <th className="py-3 pr-4 font-semibold">操作対象</th>
                  <th className="py-3 pr-4 font-semibold">アクション</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-neutral-100 last:border-b-0"
                  >
                    <td className="py-3 pl-4 pr-4 text-foreground-muted">
                      {new Date(log.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="py-3 pr-4 text-charcoal-900">
                      {actorLabel(log)}
                    </td>
                    <td className="py-3 pr-4 font-mono text-charcoal-900">
                      {targetTypeLabel(log.target_type)} / {log.target_id}
                    </td>
                    <td className="py-3 pr-4 text-charcoal-900">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </Card>
        </>
      )}
    </main>
  );
}
