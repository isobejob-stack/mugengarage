import { LINE_URL } from "@/lib/site-config";
import { InquiryForm } from "@/components/crm/inquiry-form";

// SCR-PUB-017: 問い合わせフォーム（FR-INQ-001）
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">お問い合わせ</h1>
      <p className="mt-2 text-neutral-600">
        購入・修理・売却・部品・その他、Jaguarのことなら何でもご相談ください。お急ぎの方は
        <a
          href={LINE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-green-700 underline"
        >
          LINEでのご相談
        </a>
        もご利用いただけます。
      </p>

      <div className="mt-8">
        <InquiryForm />
      </div>
    </main>
  );
}
