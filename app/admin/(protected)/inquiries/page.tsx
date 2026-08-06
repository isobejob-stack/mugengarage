import Link from "next/link";
import { listAdminInquiries } from "@/lib/crm/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { inquiryCategoryLabels } from "@/lib/crm/schema";

const statusLabels: Record<string, string> = {
  unhandled: "未対応",
  in_progress: "対応中",
  completed: "完了",
};

const statusTones: Record<string, "danger" | "warning" | "success"> = {
  unhandled: "danger",
  in_progress: "warning",
  completed: "success",
};

const channelLabels: Record<string, string> = {
  line: "LINE",
  phone: "電話",
  email: "メール",
  form: "フォーム",
};

// SCR-ADM-007: 問い合わせ一覧（管理）
export default async function Page() {
  const inquiries = await listAdminInquiries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">問い合わせ</h1>

      {inquiries.length === 0 ? (
        <p className="mt-8 text-neutral-500">問い合わせはまだありません。</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {inquiries.map((i) => (
            <li key={i.id}>
              <Link
                href={`/admin/inquiries/${i.id}`}
                className="block rounded-md border border-neutral-200 p-4 hover:border-neutral-400"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {i.customers?.name ?? "（顧客未登録）"}
                      <span className="ml-2 text-sm text-neutral-500">
                        {channelLabels[i.channel]}・
                        {inquiryCategoryLabels[i.category]}
                      </span>
                    </p>
                    {i.message && (
                      <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
                        {i.message}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    label={statusLabels[i.response_status]}
                    tone={statusTones[i.response_status]}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
