import "server-only";
import { cache } from "react";
import type { Root } from "mdast";
import { createAdminClient } from "@/lib/supabase/admin";

// FR-LIB-002（項目間の相互リンク）の自動版。
//
// ライブラリ（用語辞典）と図鑑は「探しに行く場所」ではなく
// 「本文を読んでいて引っかかった語を引く場所」として使われる。
// そのため一覧ページへ誘導する導線ではなく、読み物の本文中で用語そのものを
// リンクにするのがこの機能の役割になる。
//
// このファイルは (1) 用語の一覧をDBから取る (2) mdast上で用語をリンクに置き換える
// の2つを持つ。(2) はDBに触らない純粋関数として切り出してあり、tests/library/ で検証している。

export type GlossaryKind = "library" | "encyclopedia";

export interface GlossaryTerm {
  term: string;
  slug: string;
  kind: GlossaryKind;
}

const KIND_LABEL: Record<GlossaryKind, string> = {
  library: "ライブラリ",
  encyclopedia: "図鑑",
};

export function glossaryHref(term: Pick<GlossaryTerm, "kind" | "slug">): string {
  return term.kind === "library"
    ? `/library/${term.slug}`
    : `/encyclopedia/${term.slug}`;
}

// 用語辞典31件＋図鑑37件を、本文を描画するたびに取り直さないための一覧取得。
// 別テーブルなのでSQLとしては1本にできないが、2本を並列に投げたうえで
// React の cache() で包み、1リクエスト（＝1ページの描画）につき1回に畳む。
// owners-archive のように1ページで本文を複数回描画する画面があるため、これが効く。
export const listGlossaryTerms = cache(async (): Promise<GlossaryTerm[]> => {
  const supabase = createAdminClient();

  const [libraryResult, encyclopediaResult] = await Promise.all([
    supabase
      .from("library_entries")
      .select("title, slug")
      .is("deleted_at", null),
    supabase
      .from("encyclopedia_entries")
      .select("title, slug")
      .is("deleted_at", null),
  ]);

  const rows: GlossaryTerm[] = [];

  for (const row of (libraryResult.data ?? []) as Array<{
    title: string | null;
    slug: string | null;
  }>) {
    if (row.title && row.slug) {
      rows.push({ term: row.title, slug: row.slug, kind: "library" });
    }
  }

  for (const row of (encyclopediaResult.data ?? []) as Array<{
    title: string | null;
    slug: string | null;
  }>) {
    if (row.title && row.slug) {
      rows.push({ term: row.title, slug: row.slug, kind: "encyclopedia" });
    }
  }

  return rows;
});

// ---------------------------------------------------------------------------
// ここから下はDBに触らない純粋なリンク挿入ロジック
// ---------------------------------------------------------------------------

/**
 * 1つの本文でリンクにする用語の上限。
 * 図鑑の本文には3,000字を超えるものがあり、上限を設けないと段落のほとんどが
 * 下線だらけになって読み物として成立しない。「気になったら引ける」程度に留める。
 */
export const DEFAULT_MAX_TERM_LINKS = 10;

/**
 * これ以下の長さの用語はリンクしない。
 * 「XK」「S1」のような2文字の語は本文中の別の語（XK150、S1の型番表記など）に
 * 紛れて誤爆する率が高く、外したときの損失より誤リンクの害の方が大きい。
 */
const MIN_TERM_LENGTH = 3;

/**
 * 自動リンクの見た目。
 * 本文の通常リンク（.prose a の実線下線）と区別できるよう点線にする。
 * 色だけで区別しない（docs/screens/03_ui_rules.md 4章）ため、線種で差を付けている。
 * globals.css は他の担当領域なので、Tailwindのユーティリティだけで完結させている
 * （@layer utilities は @layer components より後なので .prose a を上書きできる）。
 */
export const GLOSSARY_LINK_CLASS =
  "glossary-link text-primary-700 underline decoration-primary-400 decoration-dotted underline-offset-4 hover:decoration-primary-600 hover:decoration-solid";

export interface LinkTermsOptions {
  /** リンク候補の用語一覧（listGlossaryTerms の結果） */
  terms: readonly GlossaryTerm[];
  /**
   * リンクしないslug。自分自身のページを開いている場合に渡す。
   * ライブラリ「SUキャブレター」の本文中の「SUキャブレター」が自分自身へ飛んでも意味がない。
   * kindは問わず一致したslugをすべて除外する（同名の項目が図鑑側にもある場合、
   * どちらへ飛ばしても「今読んでいる説明の焼き直し」になるため）。
   */
  excludeSlugs?: readonly string[];
  /** 1本文あたりのリンク上限（既定 DEFAULT_MAX_TERM_LINKS） */
  maxLinks?: number;
}

// 走査中だけ使う軽量なmdastの形。mdastの正確な型（PhrasingContentのユニオン）は
// children配列を作り替える処理と相性が悪く、キャストだらけになって読めなくなるため、
// 内部では構造だけを持つ緩い型で扱い、公開シグネチャ側で Root を受けている。
type MdastLikeNode = {
  type: string;
  value?: string;
  children?: MdastLikeNode[];
  url?: string;
  title?: string;
  data?: Record<string, unknown>;
};

/**
 * 子孫を走査しないノード種別。
 * - link / linkReference: 既存リンクの中に別のリンクは置けない（HTMLとして不正）
 * - heading: 見出しがリンクだらけになると記事の骨格が読み取れなくなる
 * - code / inlineCode / image / imageReference / html: 本文ではなくコードや属性値。
 *   これらは text 子ノードを持たない葉ノードなので実際には自動的に除外されるが、
 *   「意図して外している」ことを残すために明示する。
 */
const SKIP_NODE_TYPES = new Set([
  "link",
  "linkReference",
  "heading",
  "code",
  "inlineCode",
  "image",
  "imageReference",
  "html",
  "definition",
  "footnoteReference",
  "yaml",
]);

type PreparedTerm = GlossaryTerm & {
  /** 大文字小文字を無視して比較するための小文字化済みの用語 */
  lower: string;
};

const ASCII_ALNUM = /[0-9A-Za-z]/;

function isAsciiAlnum(char: string | undefined): boolean {
  return char !== undefined && ASCII_ALNUM.test(char);
}

/**
 * リンク候補を、マッチさせる順に並べ替えて返す。
 * 長い用語から順に試すことで「XKエンジン」があるときに「XK」でリンクしてしまうのを防ぐ。
 */
export function prepareGlossaryTerms(
  terms: readonly GlossaryTerm[],
  excludeSlugs: readonly string[] = [],
): PreparedTerm[] {
  const excluded = new Set(excludeSlugs);
  const byLower = new Map<string, PreparedTerm>();

  for (const entry of terms) {
    const term = entry.term.trim();
    if (term.length < MIN_TERM_LENGTH) continue;
    if (excluded.has(entry.slug)) continue;

    const lower = term.toLowerCase();
    const existing = byLower.get(lower);
    // 同じ語がライブラリと図鑑の両方にある場合はライブラリを優先する。
    // 図鑑は車種・シリーズの解説、ライブラリは語義の説明であり、
    // 本文中で引っかかった「語」を引きたい読者が求めているのは後者のため。
    if (existing && !(existing.kind === "encyclopedia" && entry.kind === "library")) {
      continue;
    }
    byLower.set(lower, { ...entry, term, lower });
  }

  return [...byLower.values()].sort((a, b) => {
    if (b.term.length !== a.term.length) return b.term.length - a.term.length;
    // 同じ長さのときの順序をDBの返却順に依存させないための固定的なタイブレーク
    return a.lower < b.lower ? -1 : a.lower > b.lower ? 1 : 0;
  });
}

/**
 * text の index 位置が term と一致するか。
 * 日本語には単語境界が無く \b が使えないため、英数字で始まる／終わる用語についてのみ
 * 隣接文字が英数字でないことを自前で確認する（"XK150" の中の "XK" を弾く）。
 */
function matchesAt(text: string, index: number, term: PreparedTerm): boolean {
  const length = term.term.length;
  const slice = text.slice(index, index + length);
  if (slice.length !== length) return false;
  if (slice.toLowerCase() !== term.lower) return false;

  if (isAsciiAlnum(term.term[0]) && isAsciiAlnum(text[index - 1])) return false;
  if (
    isAsciiAlnum(term.term[length - 1]) &&
    isAsciiAlnum(text[index + length])
  ) {
    return false;
  }

  return true;
}

function createGlossaryLinkNode(
  term: PreparedTerm,
  label: string,
): MdastLikeNode {
  return {
    type: "link",
    url: glossaryHref(term),
    // 飛ぶ前に「どこへ行くリンクなのか」が分かるようにする。
    // 本文中の点線下線だけでは、押すまで行き先が読み取れない。
    title: `${KIND_LABEL[term.kind]}「${term.term}」の解説を見る`,
    // mdast-util-to-hast が data.hProperties を出力要素の属性に反映する
    data: { hProperties: { className: GLOSSARY_LINK_CLASS } },
    children: [{ type: "text", value: label }],
  };
}

/**
 * mdastの木を歩いて、text ノードの中に出てくる用語をリンクノードに差し替える。
 * 戻り値は挿入したリンクの本数。
 *
 * 生のMarkdown文字列を正規表現で置換する実装にはしていない。
 * 既存リンクのラベル・URL、コードブロック、画像のaltの中に割り込んで本文を壊すため。
 */
export function linkGlossaryTermsInTree(
  tree: Root,
  options: LinkTermsOptions,
): number {
  const maxLinks = options.maxLinks ?? DEFAULT_MAX_TERM_LINKS;
  if (maxLinks <= 0) return 0;

  const prepared = prepareGlossaryTerms(options.terms, options.excludeSlugs);
  if (prepared.length === 0) return 0;

  // 先頭1文字でリンク候補を引けるようにしておく。
  // 本文3,000字 × 用語68件を総当たりすると走査が現実的でなくなるため。
  // グループ内の並びは長い順のままなので、長い用語優先の性質は保たれる。
  const byFirstChar = new Map<string, PreparedTerm[]>();
  for (const term of prepared) {
    const key = term.lower[0];
    const bucket = byFirstChar.get(key);
    if (bucket) bucket.push(term);
    else byFirstChar.set(key, [term]);
  }

  // 同じ用語は本文中で最初の1回だけリンクする。
  // 同じ語が何度も出る本文で毎回下線が付くと、文章として読めなくなる。
  const linked = new Set<string>();
  let inserted = 0;

  function splitTextNode(value: string): MdastLikeNode[] | null {
    const parts: MdastLikeNode[] = [];
    let buffer = "";
    let index = 0;

    while (index < value.length) {
      let hit: PreparedTerm | undefined;

      if (inserted < maxLinks) {
        const candidates = byFirstChar.get(value[index].toLowerCase());
        if (candidates) {
          for (const candidate of candidates) {
            if (linked.has(candidate.lower)) continue;
            if (matchesAt(value, index, candidate)) {
              hit = candidate;
              break;
            }
          }
        }
      }

      if (!hit) {
        buffer += value[index];
        index += 1;
        continue;
      }

      if (buffer) {
        parts.push({ type: "text", value: buffer });
        buffer = "";
      }
      // 表記の大小（xk150 / XK150）は本文側の書き方を尊重してそのまま残す
      const label = value.slice(index, index + hit.term.length);
      parts.push(createGlossaryLinkNode(hit, label));
      linked.add(hit.lower);
      inserted += 1;
      index += hit.term.length;
    }

    if (parts.length === 0) return null;
    if (buffer) parts.push({ type: "text", value: buffer });
    return parts;
  }

  // unist-util-visit は直接の依存に入っていないので、必要な分だけの走査を自前で持つ。
  // children の順＝本文の登場順なので、この前順走査がそのまま「最初の1回」の判定になる。
  function walk(node: MdastLikeNode): void {
    const children = node.children;
    if (!children || children.length === 0) return;

    const next: MdastLikeNode[] = [];
    let changed = false;

    for (const child of children) {
      if (SKIP_NODE_TYPES.has(child.type)) {
        next.push(child);
        continue;
      }

      if (child.type === "text" && typeof child.value === "string") {
        const parts = inserted < maxLinks ? splitTextNode(child.value) : null;
        if (parts) {
          next.push(...parts);
          changed = true;
        } else {
          next.push(child);
        }
        continue;
      }

      walk(child);
      next.push(child);
    }

    if (changed) node.children = next;
  }

  walk(tree as unknown as MdastLikeNode);

  return inserted;
}

/**
 * react-markdown の remarkPlugins に渡すためのプラグイン。
 * `remarkPlugins={[remarkGfm, [remarkGlossaryLinks, options]]}` の形で使う。
 */
export function remarkGlossaryLinks(options: LinkTermsOptions) {
  return (tree: Root): void => {
    linkGlossaryTermsInTree(tree, options);
  };
}
