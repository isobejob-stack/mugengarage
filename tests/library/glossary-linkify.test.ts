import { describe, expect, it, vi } from "vitest";
import type { Root } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import {
  DEFAULT_MAX_TERM_LINKS,
  linkGlossaryTermsInTree,
  type GlossaryTerm,
} from "@/lib/library/glossary";

// FR-LIB-002: 本文中の用語をライブラリ・図鑑へ自動リンクする処理の検証。
//
// この機能の失敗の仕方は「リンクが付かない」ではなく「本文が壊れる」「読めなくなる」なので、
// 付くことより **付いてはいけない場所に付かないこと** を重点的に見る。
// DBには触らず、用語一覧を引数で与えて純粋関数として検証する。

// 検証対象はDBに触らない純粋関数だが、同じモジュールに用語一覧の取得も同居しているため、
// Supabaseクライアントを実際に読み込まないようモジュールごと差し替える。
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

const TERMS: GlossaryTerm[] = [
  { term: "SUキャブレター", slug: "su-carburettor", kind: "library" },
  { term: "モノコック", slug: "monocoque", kind: "library" },
  { term: "モノコックボディ", slug: "monocoque-body", kind: "encyclopedia" },
  { term: "XK150", slug: "xk150", kind: "encyclopedia" },
  { term: "XK", slug: "xk", kind: "encyclopedia" },
  { term: "Eタイプ", slug: "e-type", kind: "encyclopedia" },
];

type CollectedLink = {
  url: string;
  title: string | null;
  text: string;
  className: unknown;
};

function parse(markdown: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown);
}

/** 木の中の link ノードを本文の登場順に集める（本文からテキストを拾うだけの簡易版） */
function collectLinks(tree: Root): CollectedLink[] {
  const found: CollectedLink[] = [];

  function textOf(node: unknown): string {
    const target = node as { value?: string; children?: unknown[] };
    if (typeof target.value === "string") return target.value;
    return (target.children ?? []).map(textOf).join("");
  }

  function walk(node: unknown): void {
    const target = node as {
      type?: string;
      url?: string;
      title?: string | null;
      data?: { hProperties?: { className?: unknown } };
      children?: unknown[];
    };

    if (target.type === "link") {
      found.push({
        url: target.url ?? "",
        title: target.title ?? null,
        text: textOf(node),
        className: target.data?.hProperties?.className,
      });
    }

    for (const child of target.children ?? []) walk(child);
  }

  walk(tree);
  return found;
}

function linkify(
  markdown: string,
  options: { excludeSlugs?: string[]; maxLinks?: number } = {},
): CollectedLink[] {
  const tree = parse(markdown);
  linkGlossaryTermsInTree(tree, { terms: TERMS, ...options });
  return collectLinks(tree);
}

describe("linkGlossaryTermsInTree", () => {
  it("本文中の用語をライブラリ・図鑑へのリンクにする", () => {
    const links = linkify("この車はSUキャブレターを2基備える。");

    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("/library/su-carburettor");
    expect(links[0].text).toBe("SUキャブレター");
    // 何のリンクか押す前に分かること（色だけに頼らない目印も併せて付く）
    expect(links[0].title).toBe("ライブラリ「SUキャブレター」の解説を見る");
    expect(String(links[0].className)).toContain("decoration-dotted");
  });

  it("既存リンクのラベルの中にある用語はリンクしない", () => {
    const links = linkify("詳しくは[SUキャブレターの調整](/blog/tuning)を読む。");

    // 入れ子のリンクはHTMLとして成立しない。元のリンクだけが残る。
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("/blog/tuning");
  });

  it("参照リンクの中の用語もリンクしない", () => {
    const links = linkify(
      "詳しくは[SUキャブレターの調整][ref]を読む。\n\n[ref]: /blog/tuning\n",
    );

    expect(links.filter((l) => l.url.startsWith("/library/"))).toHaveLength(0);
  });

  it("コードブロック・インラインコードの中の用語はリンクしない", () => {
    const links = linkify(
      [
        "```",
        "SUキャブレター",
        "```",
        "",
        "設定値は `SUキャブレター` と書く。",
      ].join("\n"),
    );

    expect(links).toHaveLength(0);
  });

  it("画像のaltやURLの中の用語はリンクしない", () => {
    const links = linkify("![SUキャブレターの写真](/img/su-carburettor.jpg)");

    expect(links).toHaveLength(0);
  });

  it("見出しの中の用語はリンクしない（本文側の最初の1回が対象になる）", () => {
    const links = linkify("## SUキャブレターとは\n\n本文でもSUキャブレターに触れる。");

    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("/library/su-carburettor");
  });

  it("同じ用語は最初の1回だけリンクする", () => {
    const links = linkify(
      "SUキャブレターは名機だ。SUキャブレターの調整は難しい。SUキャブレターを外す。",
    );

    expect(links).toHaveLength(1);
    expect(links[0].url).toBe("/library/su-carburettor");
  });

  it("除外slugを渡すと、その項目へはリンクしない（自分自身へのリンク防止）", () => {
    const links = linkify("SUキャブレターの話。", {
      excludeSlugs: ["su-carburettor"],
    });

    expect(links).toHaveLength(0);
  });

  it("長い用語を優先してマッチする", () => {
    const links = linkify("Eタイプはモノコックボディを採用した。");

    const urls = links.map((l) => l.url);
    expect(urls).toContain("/encyclopedia/monocoque-body");
    expect(urls).not.toContain("/library/monocoque");
  });

  it("2文字以下の用語はリンクしない", () => {
    const links = linkify("XKは名機のエンジンだ。");

    expect(links).toHaveLength(0);
  });

  it("英数字の用語は前後が英数字のとき部分一致でリンクしない", () => {
    const matched = linkify("XK150に搭載された。");
    expect(matched.map((l) => l.url)).toEqual(["/encyclopedia/xk150"]);

    const notMatched = linkify("型式XK150Sは別物だ。");
    expect(notMatched).toHaveLength(0);
  });

  it("1本文あたりのリンク数に上限を設ける", () => {
    const markdown =
      "SUキャブレターとモノコックボディとXK150とEタイプの話。";

    expect(linkify(markdown, { maxLinks: 2 })).toHaveLength(2);
    expect(linkify(markdown).length).toBeLessThanOrEqual(
      DEFAULT_MAX_TERM_LINKS,
    );
  });

  it("リンクを差し込んでも前後の本文が欠けない", () => {
    const tree = parse("この車はSUキャブレターを2基備える。");
    linkGlossaryTermsInTree(tree, { terms: TERMS });

    function textOf(node: unknown): string {
      const target = node as { value?: string; children?: unknown[] };
      if (typeof target.value === "string") return target.value;
      return (target.children ?? []).map(textOf).join("");
    }

    expect(textOf(tree)).toBe("この車はSUキャブレターを2基備える。");
  });
});
