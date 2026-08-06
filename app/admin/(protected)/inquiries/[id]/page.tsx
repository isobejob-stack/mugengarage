import { notFound } from "next/navigation";
import { getAdminInquiryById } from "@/lib/crm/queries";
import { inquiryCategoryLabels } from "@/lib/crm/schema";
import { InquiryStatusSelect } from "@/components/crm/inquiry-status-select";

const channelLabels: Record<string, string> = {
  line: "LINE",
  phone: "電話",
  email: "メール",
  form: "フォーム",
};

// SCR-ADM-008: 問い合わせ詳細
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = await getAdminInquiryById(id);

  if (!inquiry) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">問い合わせ詳細</h1>

      <div className="mt-6 rounded-md border border-neutral-200 p-4">
        <p className="text-sm text-neutral-500">
          {channelLabels[inquiry.channel]}・
          {inquiryCategoryLabels[inquiry.category]}・
          {new Date(inquiry.received_at).toLocaleString("ja-JP")}
        </p>

        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-500">顧客情報</p>
          {inquiry.customers ? (
            <div className="mt-1">
              <p>{inquiry.customers.name}</p>
              {inquiry.customers.phone && <p>{inquiry.customers.phone}</p>}
              {inquiry.customers.email && <p>{inquiry.customers.email}</p>}
            </div>
          ) : (
            <p className="mt-1 text-neutral-400">未登録</p>
          )}
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-500">
            お問い合わせ内容
          </p>
          <p className="mt-1 whitespace-pre-wrap">{inquiry.message}</p>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-neutral-500">対応ステータス</p>
          <div className="mt-1 max-w-xs">
            <InquiryStatusSelect
              inquiryId={inquiry.id}
              initialStatus={inquiry.response_status}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
