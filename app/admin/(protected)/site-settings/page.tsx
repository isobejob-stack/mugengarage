import { getSiteSettings } from "@/lib/settings/queries";
import { SiteSettingsForm } from "@/components/settings/site-settings-form";
import type { SiteSettingsFormValues } from "@/lib/settings/schema";

// 店舗情報・LINE URL・掲載媒体リンクの編集画面。
// これらはコード内の定数ではなく管理画面から編集できるべきという方針
// （BR-DATA-003「ハードコードしない」を店舗プロフィールにも適用）。
export default async function Page() {
  const settings = await getSiteSettings();

  // DB上は「未設定＝NULL」だが、フォームのinputはnullを扱えないため空文字に変換する
  const initialValues: SiteSettingsFormValues = {
    postal_code: settings.postal_code ?? "",
    address: settings.address ?? "",
    phone: settings.phone ?? "",
    business_hours: settings.business_hours ?? "",
    closed_days: settings.closed_days ?? "",
    founded_year: settings.founded_year ?? "",
    representative_name: settings.representative_name ?? "",
    access_info: settings.access_info ?? "",
    line_url: settings.line_url ?? "",
    external_links: settings.external_links.map((link) => ({
      label: link.label,
      url: link.url,
      description: link.description ?? null,
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-serif text-2xl font-bold text-charcoal-900">
        店舗情報・リンク設定
      </h1>
      <p className="mt-2 text-base text-foreground-muted">
        住所・電話番号・営業時間・LINEのURL・掲載媒体のリンクを編集できます。
        保存すると公開サイトにすぐ反映されます。
      </p>

      <SiteSettingsForm initialValues={initialValues} />
    </main>
  );
}
