"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/api/client";
import { EDITABLE_TARGETS } from "@/lib/live-edit/registry";

// 管理画面の中に公開画面をそのまま出し、クリックした場所を直せるようにする画面。
//
// 発注者の要望:
// 「本番環境ではなく、管理画面でログインしながら、仮想の本番画面を全て操作できる。
//   すでに出ている記事も文言も一言一句、画像も差し替え・追加できる状態にしてほしい」
//
// 従来は「直したい文章がどの管理画面のどの項目か」を人間が対応付ける必要があり、
// 60項目ある車両フォームから該当の欄を探す作業が毎回発生していた。
// 見えているものを押せば、その項目の編集欄が開く形にする。
//
// 仕組み:
//   - iframe に公開サイトを出す（同一オリジン。Cookieで編集モードを立てている）
//   - iframe 側（components/live-edit/edit-mode-overlay.tsx）が
//     クリックされた箇所の「型・ID・項目名」を postMessage で送ってくる
//   - こちらは項目単位の保存API（/api/admin/live-edit）で書き戻し、iframeを読み直す
//
// 保存に既存のPATCH APIを使わないのは、あちらがフォーム全体のスキーマ検証を
// 前提にしており、1項目だけ送ると必須項目が足りずに落ちるため。

type EditTarget = {
  type: string;
  id: string;
  field: string;
  label?: string;
  fallback?: string;
};

// 見に行きたくなる代表的なページ。ここから入って、あとはiframeの中を普通に辿る。
const START_PAGES = [
  { label: "トップ", path: "/" },
  { label: "在庫車両", path: "/vehicles" },
  { label: "ジャガーを知る", path: "/jaguar" },
  { label: "ブログ", path: "/blog" },
  { label: "店舗情報", path: "/about" },
  { label: "お問い合わせ", path: "/contact" },
];

export function LiveEditor() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [path, setPath] = useState("/");
  const [currentPath, setCurrentPath] = useState("/");
  const [target, setTarget] = useState<EditTarget | null>(null);
  const [value, setValue] = useState("");
  const [loadingValue, setLoadingValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // 編集モードのCookieを立ててからiframeを出す。
  // 先に出すと、編集の目印が付いていない状態の公開画面が一度描画されてしまう。
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await sendJson("/api/admin/live-edit/session", "POST");
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      // 画面を離れたら編集モードを畳む。立てたままだと、
      // 店主が公開サイトを見たときに枠線が出て「客に見えている画面」を確認できない。
      void fetch("/api/admin/live-edit/session", { method: "DELETE" });
    };
  }, []);

  const fieldConfig = target
    ? EDITABLE_TARGETS[target.type]?.fields[target.field]
    : undefined;
  const targetLabel = target ? EDITABLE_TARGETS[target.type]?.label : undefined;

  // iframe から「ここを編集したい」と言われたら、DBの生の値を取りに行く。
  // 画面に出ている文字をそのまま初期値にはできない（Markdownは描画後、価格は整形後のため）。
  const openTarget = useCallback(async (next: EditTarget) => {
    setTarget(next);
    setError(null);
    setSavedAt(null);
    setLoadingValue(true);

    const params = new URLSearchParams({
      type: next.type,
      id: next.id,
      field: next.field,
    });

    // lib/api/client.ts はGETを扱わないため、ここだけ素のfetchを使う。
    // 通信が失敗しても画面を固まらせないよう、例外は必ずここで受け止める。
    try {
      const response = await fetch(`/api/admin/live-edit?${params.toString()}`);
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        setError(json?.error?.message ?? "読み込みに失敗しました");
        setValue("");
        setLoadingValue(false);
        return;
      }

      // 固定文言はDBに行が無い状態が普通（編集して初めて行ができる）。
      // その場合は画面に出ていた既定文言を初期値にする。
      const raw = json?.data?.value;
      setValue(
        raw === null || raw === undefined ? (next.fallback ?? "") : String(raw),
      );
    } catch {
      setError("通信に失敗しました。もう一度お試しください。");
      setValue("");
    }

    setLoadingValue(false);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.source !== "mg-live-edit") return;
      if (event.data.kind === "select") {
        void openTarget(event.data.payload as EditTarget);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [openTarget]);

  const save = async () => {
    if (!target) return;
    setSaving(true);
    setError(null);

    const result = await sendJson("/api/admin/live-edit", "PATCH", {
      type: target.type,
      id: target.id,
      field: target.field,
      value,
      description: target.label,
    });

    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setSavedAt(new Date().toLocaleTimeString("ja-JP"));
    // 保存した結果を、実際の公開画面の見た目で確認できるようにする。
    iframeRef.current?.contentWindow?.postMessage(
      { source: "mg-live-edit-parent", kind: "reload" },
      window.location.origin,
    );
  };

  const go = (nextPath: string) => {
    setPath(nextPath);
    setTarget(null);
  };

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-8rem)] lg:flex-row">
      <section className="flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 p-3">
          {START_PAGES.map((page) => (
            <button
              key={page.path}
              type="button"
              onClick={() => go(page.path)}
              className={`ease-standard min-h-11 rounded-lg px-3 text-sm transition-colors duration-200 ${
                currentPath === page.path
                  ? "bg-primary-50 text-primary-700 font-bold"
                  : "text-charcoal-800 hover:bg-neutral-100"
              }`}
            >
              {page.label}
            </button>
          ))}
          <span className="text-foreground-muted ml-auto truncate text-sm">
            {currentPath}
          </span>
        </div>

        {ready ? (
          <iframe
            ref={iframeRef}
            src={path}
            title="公開画面のプレビュー"
            className="h-full min-h-[60vh] w-full flex-1"
            onLoad={() => {
              // 同一オリジンなので、iframeの中で移動した先のパスを読める。
              // 店主が普通にサイトを辿って直したいページへ行けるようにするため、
              // 移動先を上のパス表示に反映する。
              try {
                const next =
                  iframeRef.current?.contentWindow?.location.pathname ?? "/";
                setCurrentPath(next);
              } catch {
                // クロスオリジンへ出た場合は読めない。表示を変えないだけでよい。
              }
            }}
          />
        ) : (
          <p className="text-foreground-muted p-6 text-base">
            編集モードを準備しています…
          </p>
        )}
      </section>

      <aside className="w-full shrink-0 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-4 lg:w-96">
        {!target ? (
          <div>
            <h2 className="text-charcoal-900 font-serif text-xl font-bold">
              直したい場所をクリック
            </h2>
            <p className="text-foreground-muted mt-2 text-base leading-relaxed">
              左の画面は、お客様に見えているものと同じです。
              点線で囲まれているところが、この画面から直せる場所です。
              クリックすると、ここに入力欄が出ます。
            </p>
            <p className="text-foreground-muted mt-3 text-base leading-relaxed">
              リンクを押せば、いつもどおりページを移動できます。
              直したいページまで進んでから、その場所をクリックしてください。
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-foreground-muted text-sm">{targetLabel}</p>
              <h2 className="text-charcoal-900 font-serif text-xl font-bold">
                {target.label ?? fieldConfig?.label ?? target.field}
              </h2>
              {fieldConfig?.help && (
                <p className="text-foreground-muted mt-1 text-sm">
                  {fieldConfig.help}
                </p>
              )}
            </div>

            {loadingValue ? (
              <p className="text-foreground-muted text-base">読み込み中…</p>
            ) : fieldConfig?.input === "number" ? (
              <input
                type="number"
                className="input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : fieldConfig?.input === "text" ? (
              <input
                type="text"
                className="input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            ) : (
              <textarea
                className="input min-h-64 font-mono text-sm"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            )}

            {fieldConfig?.input === "markdown" && (
              <p className="text-foreground-muted text-sm">
                見出しは行頭に「## 」、箇条書きは「- 」で書けます。
              </p>
            )}

            {error && (
              <p className="text-base text-red-600" role="alert">
                {error}
              </p>
            )}
            {savedAt && !error && (
              <p className="text-base text-green-700">
                {savedAt} に保存しました
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={saving || loadingValue}
                onClick={() => void save()}
              >
                {saving ? "保存中..." : "保存する"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setTarget(null)}
              >
                閉じる
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
