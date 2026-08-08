import { InquiryForm } from "@/components/crm/inquiry-form";
import { LineConsultationMenu } from "@/components/layout/line-consultation-menu";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "お問い合わせ",
  description:
    "車両のご購入・整備・修理・買取のご相談を承ります。LINEまたはフォームからお気軽にお問い合わせください。",
  path: "/contact",
});

// SCR-PUB-017: 問い合わせフォーム（FR-INQ-001）
// レビュー指摘対応（修正2）: 冒頭の文中リンク（カテゴリなし・プリフィルなし）はLineConsultationMenuと
// 導線が重複していたため削除し、下部のカテゴリメニューへ視線を誘導する文言に変更した。
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-serif text-3xl font-bold tracking-tight text-balance text-charcoal-900 sm:text-4xl">
        お問い合わせ
      </h1>
      <p className="mt-2 text-foreground-muted">
        購入・修理・売却・部品・その他、Jaguarのことなら何でもご相談ください。お急ぎの方は下記からLINEでご相談いただけます。
      </p>

      {/* FR-LINE-002: カテゴリ別のLINE相談導線 */}
      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft sm:p-6">
        <LineConsultationMenu />
      </div>

      <p className="mt-6 text-sm text-foreground-muted">
        LINEでのご相談は即時性が高くおすすめです。じっくり文章で伝えたい方は下記フォームをご利用ください。
      </p>

      <div className="mt-4">
        <InquiryForm />
      </div>
    </main>
  );
}
