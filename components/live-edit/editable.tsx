import type { ReactNode } from "react";
import { isLiveEditEnabled } from "@/lib/live-edit/context";

// 公開画面の「ここは編集できる」という目印。
//
// ライブ編集モードでないときは、渡された中身をそのまま返すだけで、
// DOMに余計な要素もクラスも属性も足さない。
// 公開サイトの見た目・構造・パフォーマンスを編集機能のために犠牲にしないための作り。
//
// 使い方:
//   <Editable type="vehicle" id={vehicle.id} field="sales_comment" as="div">
//     <ReactMarkdown>{vehicle.sales_comment}</ReactMarkdown>
//   </Editable>
//
// どの型のどの項目が編集できるかは lib/live-edit/registry.ts の許可リストが決める。
// ここに書いた組み合わせが許可リストに無ければ、保存時にAPIが弾く。
export async function Editable({
  type,
  id,
  field,
  label,
  as = "span",
  className,
  children,
}: {
  type: string;
  id: string;
  field: string;
  /** 編集パネルの見出しを上書きしたいときだけ指定する（既定は許可リストのラベル） */
  label?: string;
  /** 中身がブロック要素（本文など）のときは "div" にする。span の中に div は置けない */
  as?: "span" | "div";
  className?: string;
  children: ReactNode;
}) {
  const Tag = as;

  // 編集モードでないときも、レイアウトに効くclassNameは残す。
  //
  // 以前はここで <>{children}</> を返しており、呼び出し側が渡した余白（mt-8 等）が
  // 通常表示のときだけ消えていた。編集機能の有無で公開画面の見た目が変わるのは、
  // 「お客様に見えている画面をそのまま編集する」という前提そのものを壊す。
  if (!(await isLiveEditEnabled())) {
    return className ? <Tag className={className}>{children}</Tag> : <>{children}</>;
  }

  return (
    <Tag
      data-mg-edit=""
      data-mg-type={type}
      data-mg-id={id}
      data-mg-field={field}
      data-mg-label={label}
      className={className}
    >
      {children}
    </Tag>
  );
}
