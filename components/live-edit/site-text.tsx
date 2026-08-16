import { getSiteTexts } from "@/lib/live-edit/texts";
import { isLiveEditEnabled } from "@/lib/live-edit/context";

// 画面に直接書かれていた固定文言を、あとから店主が直せるようにするための部品。
//
//   <SiteText k="home.hero.lead">
//     30年以上の実績を持つクラシックJaguar専門店。
//   </SiteText>
//
// 既定の文言はコードに残したまま、DB（site_texts）に同じキーの行があればそちらを出す。
// つまり:
//   - テーブルが無くても、1行も編集していなくても、今までどおりの文言が出る
//   - ライブ編集で書き換えた文言だけがDBに増える
// という形で、全文言を一度にDBへ移す大工事をせずに移行できる。
//
// 注意: children には**文字列だけ**を渡すこと。
// 途中にリンクや装飾が入る文言は、そのままでは1つの編集単位にできない。
// その場合は文言を分割するか、この部品を使わず従来どおりコードで持つ。
export async function SiteText({
  k,
  description,
  children,
}: {
  k: string;
  /** 管理画面の一覧で「どの画面のどこか」を人が判断するための説明 */
  description?: string;
  children: string;
}) {
  const [texts, editable] = await Promise.all([
    getSiteTexts(),
    isLiveEditEnabled(),
  ]);

  const value = texts.get(k) ?? children;

  if (!editable) return <>{value}</>;

  return (
    <span
      data-mg-edit=""
      data-mg-type="site_text"
      data-mg-id={k}
      data-mg-field="value"
      data-mg-label={description ?? "画面の文言"}
      // 未編集の文言は既定値がDBに無い。編集パネルが初期値として使えるよう持たせる。
      data-mg-fallback={children}
      data-mg-description={description}
    >
      {value}
    </span>
  );
}
