import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { isLiveEditEnabled } from "@/lib/live-edit/context";
import { EditModeOverlay } from "@/components/live-edit/edit-mode-overlay";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ライブ編集の操作層は、管理者がライブ編集画面を開いているあいだだけ載せる。
  // 通常の来訪者にはこのコンポーネント自体が描画されないため、
  // 公開サイトのJavaScript量も見た目も変わらない。
  const liveEdit = await isLiveEditEnabled();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
      {liveEdit && <EditModeOverlay />}
    </div>
  );
}
