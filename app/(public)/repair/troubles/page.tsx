import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { SiteText } from "@/components/live-edit/site-text";
import { EditableProse } from "@/components/live-edit/editable-prose";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildArticleStructuredData,
  serializeStructuredData,
} from "@/lib/seo/structured-data";
import { SITE_URL } from "@/lib/site-config";

// ライブ編集で直した本文を次のデプロイを待たずに出すため、リクエストごとに描画する
export const dynamic = "force-dynamic";

const TITLE =
  "ジャガーの故障しやすいところ｜旧車の弱点と、買う前・乗る前の確認点";
const DESCRIPTION =
  "ジャガー・ディムラーの旧車で故障しやすいところを、冷却系・ゴム部品・電装・サビなど年代に共通することと、直6・V12・V8のエンジン別、XJ40・X350などの車種別にまとめました。買う前に確かめたい点と、長く乗るためのコツも。神奈川県川崎市・南足柄市の専門店エムガレージ。";
// このページを公開した日（構造化データの datePublished）
const PUBLISHED_AT = "2026-11-12";

export const metadata = buildPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/repair/troubles",
});

// 章立て。整備・修理のページなどから #id で直接飛べるよう、見出しはここで持つ
const SECTIONS = [
  { id: "common", title: "どの年代にも共通すること" },
  { id: "engine", title: "エンジン別に気をつけたいところ" },
  { id: "model", title: "車種ごとに知られていること" },
  { id: "check", title: "買う前・乗る前に確かめたいこと" },
  { id: "care", title: "長く乗るために" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// 各章の既定の本文（Markdown）。店主が「画面を見ながら直す」で章ごとに書き換えられる。
//
// 事実の扱い（docs/tasks/CONTENT_FACTCHECK.md と同じ方針）:
// - 書いているのは、ジャガーの旧車について一般に広く知られている傾向だけ。値段・交換時期の数字は書かない
// - エンジンの材質（直6は鋳鉄、V8・V12はアルミ）と付き合い方は「ジャガーを知る」4章と同じ整理にしてある
// - 店主に確かめてほしい箇所は docs/tasks/SEO_KEYWORDS_2026-11-12.md に一覧にした
const BODIES: Record<SectionId, string> = {
  common: `### 冷却系（ラジエーター・ホース・ウォーターポンプ）

古いジャガーでいちばん多く話題になるのが冷却系です。ラジエーターの詰まり、ホースの硬化やひび割れ、ウォーターポンプからの水漏れ、樹脂でできたタンクや継手の割れが、オーバーヒートにつながります。エンジンそのものより先に、まわりの部品が年数で弱っていくのが典型です。

**こんな兆しがあれば早めに：** 水温計がいつもより高い位置で止まる、甘い匂いがする、駐車した場所に水の跡が残る。

### ゴム・樹脂の部品

足まわりのブッシュ、エンジンマウント、各種ホース、ドアや窓のゴム（ウェザーストリップ）は、走行距離が少なくても年数で硬くなります。乗り心地の悪化、異音、雨漏り、燃料や冷却水のにじみの原因になります。**「走行距離が少ないから安心」とは言い切れない**のが旧車です。

### 電装

パワーウインドウ、集中ドアロック、メーター、エアコンの操作系など、電気で動く部分の不具合も多い分野です。部品そのものの故障だけでなく、コネクターの接触不良や、アース（車体への接地）の劣化が原因であることも少なくありません。

### オイルのにじみ

年数を経たエンジンでは、ガスケットやシールからのオイルのにじみはある程度避けられません。量と場所によって、様子を見てよいものと、早めに直したほうがよいものがあります。

### サビ

古い年式の車体ほど、サイドシル（ドアの下）、ホイールアーチ、トランクの床まわりにサビが出やすくなります。年式が新しくなるにつれて防錆は良くなっていますが、どこでどう保管されてきたかで差が大きく出ます。`,

  engine: `ジャガーのエンジンは、大きく分けて直列6気筒・V12・V8の3つです。丈夫な部分と、手をかけたい部分がそれぞれ違います。

### 直列6気筒（XKエンジン・AJ6・AJ16）

シリンダーブロックが鋳鉄で、腰下（エンジンの下半分）は丈夫です。手入れされてきた個体なら、長く使えることが多いエンジンです。気をつけたいのは本体よりも、**冷却系・補機類・オイルのにじみ**といった周辺の部分です。XJ6や、1994年からのX300型XJがこのエンジンを積んでいます。

### V12（XJ-S・XJ12・ダブルシックス）

ほかに代わるものが無いと言われる滑らかさと引き換えに、**熱を多く出すエンジン**です。ブロックはアルミ合金で、冷却系の状態がそのままエンジンの寿命に関わります。ラジエーター・ホース・冷却ファンの点検は欠かせません。エンジンルームに燃料や冷却水のホースが多く、ゴム部品の劣化の影響を受けやすい点にも注意が必要です。

### V8（AJ-V8。XK8、X308型XJ以降）

初期のAJ-V8は、タイミングチェーンの張りを保つ部品（テンショナー）に樹脂が使われており、**年数とともに割れることがある**と知られています。のちに対策品が出ているので、交換されているかどうかは確かめたい点です。V12と同じくアルミのブロックで、冷却系の管理がとくに大切です。`,

  model: `### XJ40（1986〜1994年のXJ）

電子制御の装備が大きく増えた最初の世代で、**電装まわりの不具合**の話題が多い車種です。メーターや警告表示、配線の接触不良など、原因を一つずつたどる整備が必要になることがあります。

### X350型XJ（2003年〜）

アルミのボディに、**エアサスペンション**を標準で備えた世代です。年数とともにエアスプリングやコンプレッサーが傷み、車高が下がる症状が知られています。

### XJ-S（1975〜1996年）・シリーズ3までのXJ

サビの出やすさに個体差が大きい世代です。下回り・ホイールアーチ・サイドシルの状態は、購入前にいちばん見ておきたいところです。`,

  check: `旧車選びで大切なのは、いま壊れていないかより、**これまでどう手をかけられてきたか**です。次の点を確かめると、その個体の素性が見えてきます。

- **整備の記録** ── いつ、どこを替えたかが残っているか
- **冷却系の交換歴** ── ラジエーター・ホース・ウォーターポンプ
- **試乗での様子** ── 水温が安定しているか、エアコンが効くか、変速は滑らかか
- **電装品** ── 窓・ドアロック・メーター・エアコンがすべて動くか
- **下回り** ── サビ、オイルや冷却水のにじみ
- **V8の場合** ── タイミングチェーンのテンショナーが対策品に替わっているか

当店の在庫車両の状態は、お問い合わせいただければ実車を見ながらご説明します。`,

  care: `**暖機をする。** 冷えた状態で回さないだけで、エンジンの傷み方が変わります。

**止めっぱなしにしない。** 月に一度は走らせてください。動かさずにいると、ゴムや油脂類はかえって傷みやすくなります。

**冷却系は先手で。** 水回りは消耗品と考え、症状が出る前に替える。ここを守ることが、ジャガーと長く付き合ういちばんの近道です。`,
};

const LINK_CLASS =
  "text-primary-700 ease-standard inline-flex min-h-11 items-center gap-1.5 font-medium underline decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-2";

// ジャガーの故障しやすいところ（2026-11-12 新設）。
//
// 「ジャガー 故障」「ジャガー 旧車 弱点」「XJ40 故障」「V12 オーバーヒート」のように、
// 買う前・乗っている最中に不安を調べる人の受け皿。答えを先に渡し、整備・修理のページと在庫へ送る。
// AIの回答（「ジャガーの旧車は何が壊れやすい？」）の出典にもなりやすい形（見出し＋短い段落）にしてある。
export default function Page() {
  const structuredDataJson = serializeStructuredData(
    buildArticleStructuredData({
      title: TITLE,
      description: DESCRIPTION,
      url: `${SITE_URL}/repair/troubles`,
      publishedAt: PUBLISHED_AT,
      updatedAt: null,
      category: "整備・修理",
    }),
  );

  return (
    <main className="pb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: structuredDataJson }}
      />
      <section className="bg-cream-100 border-b border-neutral-200">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <Breadcrumb
            items={[
              { label: "整備・修理", href: "/repair" },
              { label: "ジャガーの故障しやすいところ" },
            ]}
          />
          <h1 className="text-charcoal-900 mt-4 font-serif text-3xl font-bold tracking-tight text-balance [word-break:auto-phrase] sm:text-5xl">
            <SiteText
              k="troubles.hero.title"
              description="故障しやすいところ 大見出し"
            >
              ジャガーの故障しやすいところ
            </SiteText>
          </h1>
          <div className="mt-6">
            <EditableProse
              k="troubles.hero.lead"
              description="故障しやすいところ 冒頭のリード文"
              className="prose prose-lg max-w-none"
            >
              {`「ジャガーは壊れやすい」とよく言われます。半分は本当で、半分は誤解です。

30年、40年と経った車ですから、ゴムや樹脂の部品、配線、冷却系は確実に傷みます。一方で、**どこが傷みやすいかはかなりはっきりしていて**、先に手を入れておけば防げるものが少なくありません。

ここでは、ジャガー・ディムラーの旧車でよく知られている「故障しやすいところ」を、どの年代にも共通することと、エンジン・車種ごとのことに分けてまとめました。個体の状態は1台ずつ違いますので、目安としてお読みください。`}
            </EditableProse>
          </div>
          <nav aria-label="このページの目次" className="mt-8">
            <ol className="flex flex-col gap-1">
              {SECTIONS.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={LINK_CLASS}>
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="mt-14 scroll-mt-8 border-t border-neutral-200 pt-10 first:border-t-0"
          >
            <h2 className="text-charcoal-900 font-serif text-2xl font-bold tracking-tight text-balance [word-break:auto-phrase] sm:text-3xl">
              <SiteText
                k={`troubles.${section.id}.heading`}
                description={`故障しやすいところ 見出し（${section.title}）`}
              >
                {section.title}
              </SiteText>
            </h2>
            <EditableProse
              k={`troubles.${section.id}.body`}
              description={`故障しやすいところ「${section.title}」の本文`}
              className="prose mt-6 max-w-none"
            >
              {BODIES[section.id]}
            </EditableProse>
          </section>
        ))}

        <p className="mt-12 flex flex-wrap gap-x-5 border-t border-neutral-200 pt-8">
          <Link href="/jaguar" className={LINK_CLASS}>
            エンジンの成り立ちは「ジャガーを知る」へ
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/faq" className={LINK_CLASS}>
            よくある質問
            <span aria-hidden="true">→</span>
          </Link>
        </p>

        <section className="bg-cream-100 mt-10 rounded-2xl border border-neutral-200 px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="text-charcoal-900 font-serif text-xl font-bold tracking-tight text-balance sm:text-2xl">
            <SiteText
              k="troubles.contact.heading"
              description="故障しやすいところ 相談の見出し"
            >
              気になる症状があるときは
            </SiteText>
          </h2>
          <p className="text-foreground-muted mt-2">
            <SiteText
              k="troubles.contact.lead"
              description="故障しやすいところ 相談の説明文"
            >
              ジャガー・ディムラーの整備・修理を承っています。車種・年式と症状をお聞かせください。
            </SiteText>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/repair" variant="primary" size="lg">
              整備・修理について
            </Button>
            <Button href="/vehicles" variant="outline" size="lg">
              在庫車両を見る
            </Button>
          </div>
        </section>
      </article>
    </main>
  );
}
