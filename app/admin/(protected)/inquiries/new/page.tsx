import { listAdminCustomers } from "@/lib/crm/queries";
import { ManualInquiryForm } from "@/components/crm/manual-inquiry-form";
import { Card, CardBody } from "@/components/ui/card";

// SCR-ADM-007から遷移する手動登録画面（FR-INQ-002 / event_flow.md 3.5）。
// 電話・LINE・来店で受けた相談は、ここで記録しないとどこにも残らない。
export default async function Page() {
  const customers = await listAdminCustomers();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-charcoal-900 font-serif text-2xl font-bold">
        問い合わせを手動で登録
      </h1>
      <p className="text-foreground-muted mt-2 text-base">
        電話・LINE・来店で受けたご相談を記録します。
      </p>

      <Card className="mt-6">
        <CardBody className="p-6">
          <ManualInquiryForm customers={customers} />
        </CardBody>
      </Card>
    </main>
  );
}
