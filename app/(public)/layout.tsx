import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { isLiveEditEnabled } from "@/lib/live-edit/context";
import { getSiteTexts } from "@/lib/live-edit/texts";
import { EditModeOverlay } from "@/components/live-edit/edit-mode-overlay";
import { SiteTextProvider } from "@/components/live-edit/site-text-provider";
import { getSiteSettings } from "@/lib/settings/queries";
import { getSiteAssetPublicUrl } from "@/lib/settings/storage";
import { buildBusinessGraph } from "@/lib/seo/business";
import { serializeStructuredData } from "@/lib/seo/structured-data";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ライブ編集の操作層は、管理者がライブ編集画面を開いているあいだだけ載せる。
  // 通常の来訪者にはこのコンポーネント自体が描画されないため、
  // 公開サイトのJavaScript量も見た目も変わらない。
  const [liveEdit, texts, settings] = await Promise.all([
    isLiveEditEnabled(),
    getSiteTexts(),
    // 店舗情報はキャッシュされている（lib/cache/tags.ts）。ヘッダー・フッターと同じ値を読む
    getSiteSettings(),
  ]);

  // 店舗とサイトの構造化データ（lib/seo/business.ts）。全ページに同じものを出し、
  // どのページから入っても「川崎市のジャガー・ディムラー専門店エムガレージのサイト」だと分かるようにする
  const businessGraphJson = serializeStructuredData(
    buildBusinessGraph({
      settings,
      heroImageUrl: settings.hero_image_path
        ? getSiteAssetPublicUrl(settings.hero_image_path)
        : null,
    }),
  );

  return (
    // クライアントコンポーネントの中の文言（ヘッダーのナビゲーション、検索ブロック等）も
    // 編集対象にするため、文言の一覧をここで一度だけ渡す。
    // 渡るのは「編集されて実際にDBに行がある文言」だけなので、未編集のあいだはほぼ空。
    <SiteTextProvider texts={Object.fromEntries(texts)} editable={liveEdit}>
      <div className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: businessGraphJson }}
        />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        {liveEdit && <EditModeOverlay />}
      </div>
    </SiteTextProvider>
  );
}
