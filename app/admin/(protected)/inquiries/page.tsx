import { listAdminInquiries } from "@/lib/crm/queries";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  inquiryCategoryLabels,
  inquiryChannelLabels,
  inquiryResponseStatusLabels,
  inquiryResponseStatusTones,
  isManualInquiry,
} from "@/lib/crm/schema";

// SCR-ADM-007: 問い合わせ一覧（管理）
export default async function Page() {
  const inquiries = await listAdminInquiries();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
          問い合わせ
        </h1>
        {/* FR-INQ-002: 電話・LINE・来店で受けた相談は運用者が手で記録する。
            一覧から1タップで入れないと、接客の合間の記録は続かない。 */}
        <Button href="/admin/inquiries/new" variant="primary" size="md">
          手動で登録する
        </Button>
      </div>

      {inquiries.length === 0 ? (
        <p className="text-foreground-muted mt-8 text-base">
          問い合わせはまだありません。
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {inquiries.map((i) => (
            <li key={i.id}>
              <Card href={`/admin/inquiries/${i.id}`}>
                <CardBody className="flex flex-row items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-charcoal-900 text-lg font-semibold">
                      {i.customers?.name ?? "（顧客未登録）"}
                    </p>
                    <p className="text-foreground-muted text-base">
                      {inquiryChannelLabels[i.channel]}・
                      {inquiryCategoryLabels[i.category]}・
                      {new Date(i.received_at).toLocaleDateString("ja-JP")}
                      {/* 公開フォーム由来か店側の手動記録かで、内容の粒度も追い方も変わる */}
                      {isManualInquiry(i.channel) && "（手動登録）"}
                    </p>
                    {i.message && (
                      <p className="text-foreground-muted mt-1 line-clamp-1 text-base">
                        {i.message}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    label={inquiryResponseStatusLabels[i.response_status]}
                    tone={inquiryResponseStatusTones[i.response_status]}
                  />
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
