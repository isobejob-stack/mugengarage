import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { isLiveEditEnabled } from "@/lib/live-edit/context";
import { getSiteTexts } from "@/lib/live-edit/texts";
import { EditModeOverlay } from "@/components/live-edit/edit-mode-overlay";
import { SiteTextProvider } from "@/components/live-edit/site-text-provider";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ライブ編集の操作層は、管理者がライブ編集画面を開いているあいだだけ載せる。
  // 通常の来訪者にはこのコンポーネント自体が描画されないため、
  // 公開サイトのJavaScript量も見た目も変わらない。
  const [liveEdit, texts] = await Promise.all([
    isLiveEditEnabled(),
    getSiteTexts(),
  ]);

  return (
    // クライアントコンポーネントの中の文言（ヘッダーのナビゲーション、検索ブロック等）も
    // 編集対象にするため、文言の一覧をここで一度だけ渡す。
    // 渡るのは「編集されて実際にDBに行がある文言」だけなので、未編集のあいだはほぼ空。
    <SiteTextProvider texts={Object.fromEntries(texts)} editable={liveEdit}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        {liveEdit && <EditModeOverlay />}
      </div>
    </SiteTextProvider>
  );
}
