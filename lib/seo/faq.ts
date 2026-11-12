import type { SiteSettings } from "@/lib/settings/queries";
import { findInstagramContact } from "@/lib/settings/sns";
import { plainTextFromMarkdown } from "@/lib/seo/metadata";

// よくある質問（/faq）の中身（2026-11-12）。
//
// 狙い: 「ジャガー 東京」「ジャガー 修理」「ディムラー ジャガー 違い」「ジャガー 旧車 壊れやすい」のような、
// 問いの形で探す検索と、AIの回答（問いに答える形で出典を引く）の両方に、公式の答えを用意する。
//
// 事実の扱い:
// - 答えは、サイトにすでに載っている店の説明（店舗情報・お問い合わせ・ジャガーを知る）と、
//   一般に確かめられる事実（ディムラーの成り立ち、川崎市の位置）だけで書く。値段や納期のような店の方針は書かない
// - 住所・営業時間・電話などは、管理画面の店舗情報から毎回差し込む（facts）。ここに値を書かない
// - 答えの文章は、店主が「画面を見ながら直す」で書き換えられる（キー faq.<key>.q / faq.<key>.a）。
//   直した文章は構造化データにも同じものが出る（resolveFaqItems）
// - 店の方針として確かめたい答えは docs/tasks/SEO_KEYWORDS_2026-11-12.md に一覧にしてある

export type FaqLink = { href: string; label: string };

export type FaqItem = {
  /** ライブ編集のキー（faq.<key>.q / faq.<key>.a）。変えると直した文章が外れるので変えない */
  key: string;
  question: string;
  /** 既定の答え（Markdown）。DBに直した文章があればそちらを使う */
  answer: string;
  /** 店舗情報から差し込む事実（住所・営業時間など）。答えのあとに箇条書きで出す */
  facts: string[];
  links: FaqLink[];
};

export type FaqGroup = { heading: string; items: FaqItem[] };

export type FaqStockSummary = Array<{ model_year: number | null }>;

export function buildFaqGroups(params: {
  settings: SiteSettings;
  stock: FaqStockSummary;
}): FaqGroup[] {
  const { settings, stock } = params;
  const hasInstagram = findInstagramContact(settings.external_links) !== null;

  const years = stock
    .map((v) => v.model_year)
    .filter((y): y is number => typeof y === "number");
  const stockFact =
    stock.length === 0
      ? null
      : years.length > 0
        ? `いま掲載中の在庫は${stock.length}台（${Math.min(...years)}〜${Math.max(...years)}年式）です。`
        : `いま掲載中の在庫は${stock.length}台です。`;

  const address = settings.address
    ? `所在地: ${settings.postal_code ? `〒${settings.postal_code} ` : ""}${settings.address}`
    : null;
  const hours = settings.business_hours
    ? `営業時間: ${settings.business_hours}`
    : null;
  const closed = settings.closed_days
    ? `定休日: ${settings.closed_days}`
    : null;
  const phone = settings.phone ? `電話: ${settings.phone}` : null;
  const email = settings.email ? `メール: ${settings.email}` : null;

  const compact = (values: Array<string | null>) =>
    values.filter((v): v is string => v !== null);

  return [
    {
      heading: "お店について",
      items: [
        {
          key: "shop.what",
          question: "エムガレージはどんなお店ですか？",
          answer:
            "神奈川県川崎市・南足柄市にある、ジャガー・ディムラー（デイムラー）の専門店です。XJ6・XJ-S・ダブルシックスなど、ジャガーの旧車・クラシックカーを中心に、30年以上の実績で販売・整備・修理・買取・ご相談まで承っています。",
          facts: [],
          links: [
            { href: "/vehicles", label: "在庫車両を見る" },
            { href: "/repair", label: "整備・修理について" },
          ],
        },
        {
          key: "shop.where",
          question: "お店はどこにありますか？",
          answer:
            "拠点は神奈川県の川崎市と南足柄市の2か所です。どちらでお会いするかは、ご覧になりたい車両の場所とご都合に合わせてご案内します。",
          facts: compact([address]),
          links: [{ href: "/about", label: "店舗情報・アクセス" }],
        },
        {
          key: "shop.visit",
          question: "来店に予約は必要ですか？",
          answer:
            "ご来店の前に、ご連絡をお願いしています。在庫車両の場所と、対応できるお時間をご案内します。",
          facts: compact([hours, closed]),
          links: [{ href: "/contact", label: "お問い合わせ" }],
        },
        {
          key: "shop.tokyo",
          question: "東京都や横浜市からも行けますか？",
          answer:
            "はい。川崎市は多摩川をはさんで東京都と接し、横浜市とも隣り合っています。東京都内や横浜市からもお越しいただけます。ご来店の前にご連絡ください。",
          facts: [],
          links: [{ href: "/about", label: "店舗情報・アクセス" }],
        },
        {
          key: "shop.contact",
          question: "問い合わせはどうすればいいですか？",
          answer: hasInstagram
            ? "InstagramのDMが、いちばん早くお返事できる窓口です。Instagramをお使いでない方は、お電話・メール・お問い合わせフォームからどうぞ。"
            : "お電話・メール・お問い合わせフォームからどうぞ。",
          facts: compact([phone, email]),
          links: [{ href: "/contact", label: "お問い合わせ" }],
        },
      ],
    },
    {
      heading: "車選び・ご購入",
      items: [
        {
          key: "buy.lineup",
          question: "どんな車を扱っていますか？",
          answer:
            "ジャガーとディムラー（デイムラー）の旧車・クラシックカーが中心です。XJ6・XJ-S・ダブルシックスをはじめ、セダンのXJをとくに多く扱っています。",
          facts: compact([stockFact]),
          links: [
            { href: "/vehicles", label: "在庫車両を見る" },
            { href: "/encyclopedia", label: "ジャガー歴代モデル図鑑" },
          ],
        },
        {
          key: "buy.daimler",
          question: "ディムラー（デイムラー）とジャガーは何が違うのですか？",
          answer: `ディムラー（Daimler）は英国の自動車メーカーで、1960年にジャガーの傘下に入りました。それ以降のディムラーは、ジャガーの車をもとに、内装や装備を上級にした車として作られています。たとえばダブルシックスは、ジャガーXJ12をもとにしたディムラーです。

ドイツのダイムラー（メルセデス・ベンツの会社）とは別の会社です。当店で扱うのは英国のDaimlerで、日本では「ディムラー」「デイムラー」「ダイムラー」と表記が分かれています。`,
          facts: [],
          links: [{ href: "/encyclopedia", label: "ジャガー歴代モデル図鑑" }],
        },
        {
          key: "buy.reliability",
          question: "ジャガーの旧車は壊れやすいですか？",
          answer: `年数相応に傷む部品はあります。冷却系、ゴムや樹脂の部品、電装は、どの年代でも手を入れる前提で考えてください。一方で、どこが傷みやすいかははっきりしているので、先に手を入れておけば防げるものが少なくありません。

毎日確実に動くことだけを求める方には、正直に申し上げて向きません。手をかけながら長く付き合う車だと考えていただくのが、いちばん近いと思います。`,
          facts: [],
          links: [
            { href: "/repair/troubles", label: "ジャガーの故障しやすいところ" },
          ],
        },
        {
          key: "buy.cost",
          question: "維持費はどのくらいかかりますか？",
          answer:
            "年式・状態・乗り方によって大きく変わるため、一概には申し上げられません。費用がかかりやすいのは、冷却系やゴム部品の交換、電装の修理など、年数で傷む部分です。ご検討中の車両があれば、その個体の状態を見ながらご説明します。",
          facts: [],
          links: [
            { href: "/repair/troubles", label: "ジャガーの故障しやすいところ" },
          ],
        },
        {
          key: "buy.remote",
          question: "遠方に住んでいても購入できますか？",
          answer:
            "まずはお住まいの地域とご希望をお聞かせください。ご購入までの進め方をご案内します。",
          facts: [],
          links: [{ href: "/contact", label: "お問い合わせ" }],
        },
      ],
    },
    {
      heading: "整備・修理・買取",
      items: [
        {
          key: "service.other",
          question: "他店で購入したジャガーの整備・修理も頼めますか？",
          answer:
            "まずはご相談ください。車種・年式と、気になっている症状をお知らせいただければ、お受けできるかどうかをお答えします。",
          facts: [],
          links: [{ href: "/repair", label: "整備・修理について" }],
        },
        {
          key: "service.parts",
          question: "部品のことだけ相談してもいいですか？",
          answer: hasInstagram
            ? "はい。部品のご相談も承っています。InstagramのDMか、お問い合わせフォームで「部品相談」を選んでお送りください。"
            : "はい。部品のご相談も承っています。お問い合わせフォームで「部品相談」を選んでお送りください。",
          facts: [],
          links: [{ href: "/contact", label: "お問い合わせ" }],
        },
        {
          key: "service.purchase",
          question: "ジャガー・ディムラーの買取もしていますか？",
          answer:
            "はい。長く乗られたジャガー・ディムラーの買取も承っています。まずは車種・年式と、車両の状態をお聞かせください。",
          facts: [],
          links: [{ href: "/contact", label: "お問い合わせ" }],
        },
      ],
    },
  ];
}

export function faqQuestionKey(item: Pick<FaqItem, "key">) {
  return `faq.${item.key}.q`;
}

export function faqAnswerKey(item: Pick<FaqItem, "key">) {
  return `faq.${item.key}.a`;
}

// 画面に出す問いと答えを、ライブ編集で直した文章に置き換えて返す。
// 構造化データ（buildFaqPageStructuredData）にはこの結果を渡し、画面と同じ文章を出す。
// 答えの平文には、店舗情報から差し込んだ事実（住所・営業時間など）も含める。
export function resolveFaqItems(
  groups: FaqGroup[],
  texts: ReadonlyMap<string, string>,
): Array<{ question: string; answer: string }> {
  return groups.flatMap((group) =>
    group.items.map((item) => {
      const question = texts.get(faqQuestionKey(item)) ?? item.question;
      const answer = texts.get(faqAnswerKey(item)) ?? item.answer;
      return {
        question,
        answer: [plainTextFromMarkdown(answer), ...item.facts].join(" "),
      };
    }),
  );
}
