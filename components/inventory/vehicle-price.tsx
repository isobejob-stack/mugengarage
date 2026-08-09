import { CardPrice, CardMeta } from "@/components/ui/card";

// 一覧カードの価格表示。
//
// 中古車は「車両本体価格」と「支払総額（諸費用込み）」の2つが併記されるのが一般的で、
// 購入検討者が最終的に比較するのは支払総額のため、総額を主役に置き本体価格を添える。
// 総額が未登録（諸費用が未確定）の場合は、総額らしき数字を見せずに本体価格のみを出す。
//
// 一覧と詳細で表示ルールがずれると価格の誤認につながるため、カード側は本コンポーネントに集約する。
export function VehicleCardPrice({
  price,
  totalPrice,
}: {
  price: number;
  totalPrice: number | null;
}) {
  if (totalPrice === null) {
    return (
      <>
        <CardPrice>¥{price.toLocaleString()}</CardPrice>
        <CardMeta>車両本体価格（税込）</CardMeta>
      </>
    );
  }

  return (
    <>
      <CardPrice>¥{totalPrice.toLocaleString()}</CardPrice>
      <CardMeta>
        支払総額（税込） ／ 本体 ¥{price.toLocaleString()}
      </CardMeta>
    </>
  );
}
