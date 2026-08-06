import { InquiryForm } from "@/components/crm/inquiry-form";
import { LineConsultationMenu } from "@/components/layout/line-consultation-menu";

// SCR-PUB-017: 問い合わせフォーム（FR-INQ-001）
// レビュー指摘対応（修正2）: 冒頭の文中リンク（カテゴリなし・プリフィルなし）はLineConsultationMenuと
// 導線が重複していたため削除し、下部のカテゴリメニューへ視線を誘導する文言に変更した。
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">お問い合わせ</h1>
      <p className="mt-2 text-neutral-600">
        購入・修理・売却・部品・その他、Jaguarのことなら何でもご相談ください。お急ぎの方は下記からLINEでご相談いただけます。
      </p>

      {/* FR-LINE-002: カテゴリ別のLINE相談導線 */}
      <div className="mt-8 rounded-lg border border-neutral-200 p-4">
        <LineConsultationMenu />
      </div>

      <p className="mt-6 text-sm text-neutral-600">
        LINEでのご相談は即時性が高くおすすめです。じっくり文章で伝えたい方は下記フォームをご利用ください。
      </p>

      <div className="mt-4">
        <InquiryForm />
      </div>
    </main>
  );
}
