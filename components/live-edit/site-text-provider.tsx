"use client";

import { createContext, useContext, type ReactNode } from "react";

// クライアントコンポーネントの中の文言も編集できるようにするための仕掛け。
//
// <SiteText>（server component）は async でDBを引くため、
// "use client" のファイルからは呼べない。しかしヘッダーのナビゲーション、
// トップの検索ブロック、問い合わせフォームのように、
// **画面上でよく目に入る文言ほどクライアントコンポーネントにある**。
//
// そこで公開レイアウト（server component）が文言の一覧と編集モードの有無を
// このProviderに渡し、クライアント側は <EditableText> でそれを読む。
// 渡すのは「編集されて実際にDBに行がある文言」だけなので、
// 未編集のあいだ送るデータはほぼ空になる。

type SiteTextContextValue = {
  texts: Record<string, string>;
  editable: boolean;
};

const SiteTextContext = createContext<SiteTextContextValue>({
  texts: {},
  editable: false,
});

export function SiteTextProvider({
  texts,
  editable,
  children,
}: SiteTextContextValue & { children: ReactNode }) {
  return (
    <SiteTextContext.Provider value={{ texts, editable }}>
      {children}
    </SiteTextContext.Provider>
  );
}

// クライアントコンポーネント用の <SiteText>。
// 属性の付け方はサーバー版（components/live-edit/site-text.tsx）と同一にしてあり、
// 公開画面側の操作層（edit-mode-overlay.tsx）はどちらも区別せず扱える。
export function EditableText({
  k,
  description,
  children,
}: {
  k: string;
  description?: string;
  /** 既定の文言。DBに行が無ければこれが表示される */
  children: string;
}) {
  const { texts, editable } = useContext(SiteTextContext);
  const value = texts[k] ?? children;

  if (!editable) return <>{value}</>;

  return (
    <span
      data-mg-edit=""
      data-mg-type="site_text"
      data-mg-id={k}
      data-mg-field="value"
      data-mg-label={description ?? "画面の文言"}
      data-mg-fallback={children}
      data-mg-description={description}
    >
      {value}
    </span>
  );
}
