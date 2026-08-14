import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminInquiryById } from "@/lib/crm/queries";
import { inquiryCategoryLabels } from "@/lib/crm/schema";
import { InquiryStatusSelect } from "@/components/crm/inquiry-status-select";
import { Card, CardBody } from "@/components/ui/card";

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
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        問い合わせ詳細
      </h1>

      <Card className="mt-6">
        <CardBody className="p-6">
          <p className="text-foreground-muted text-base">
            {channelLabels[inquiry.channel]}・
            {inquiryCategoryLabels[inquiry.category]}・
            {new Date(inquiry.received_at).toLocaleString("ja-JP")}
          </p>

          <div className="mt-4">
            <p className="text-foreground-muted text-base font-medium">
              顧客情報
            </p>
            {inquiry.customers ? (
              <div className="text-charcoal-900 mt-1 text-base">
                <p>{inquiry.customers.name}</p>
                {inquiry.customers.phone && <p>{inquiry.customers.phone}</p>}
                {inquiry.customers.email && <p>{inquiry.customers.email}</p>}
                <Link
                  href={`/admin/customers/${inquiry.customers.id}`}
                  className="text-primary-700 mt-1 inline-block text-base hover:underline"
                >
                  顧客詳細を見る
                </Link>
              </div>
            ) : (
              <p className="text-foreground-muted mt-1 text-base">未登録</p>
            )}
          </div>

          <div className="mt-4">
            <p className="text-foreground-muted text-base font-medium">
              お問い合わせ内容
            </p>
            <p className="text-charcoal-900 mt-1 text-base whitespace-pre-wrap">
              {inquiry.message}
            </p>
          </div>

          <div className="mt-6">
            <p className="text-foreground-muted text-base font-medium">
              対応ステータス
            </p>
            <div className="mt-1 max-w-xs">
              <InquiryStatusSelect
                inquiryId={inquiry.id}
                initialStatus={inquiry.response_status}
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
