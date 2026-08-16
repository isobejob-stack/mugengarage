"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// このページがiframeの中（管理画面のライブ編集画面）で開かれているか。
//
// 値は読み込み後に変わらないため購読は不要だが、サーバー描画時には判定できない。
// useSyncExternalStore にサーバー側の既定値（＝iframeの中とみなす）を与えて、
// ハイドレーションのずれを起こさずに読む。
// useEffect で setState すると、変化しない値のために毎回もう1度描画することになる。
const subscribeNever = () => () => {};
const isInFrameOnClient = () => window.parent !== window;
const isInFrameOnServer = () => true;

// ライブ編集モードのときだけ公開画面に載せる操作層。
//
// やることは3つだけ。
//   1. 編集できる箇所に枠線を出す（どこが直せるのか分からないと使えない）
//   2. 編集できる箇所のクリックを横取りして、親フレーム（管理画面）に「ここを編集したい」と伝える
//   3. 編集モードから抜ける導線を出す
//
// 編集できない箇所のクリックは邪魔しない。店主は公開サイトと同じようにページを
// 行き来しながら、直したい場所に着いたらそこをクリックする、という使い方をする。
//
// 見た目の変更はこのコンポーネントが差し込む <style> だけで完結させ、
// 公開サイト側のCSS（globals.css）は汚さない。編集機能を消すときに1ファイル消せば済む。
const OVERLAY_STYLE = `
[data-mg-edit] {
  outline: 1px dashed rgba(37, 99, 235, 0.45);
  outline-offset: 2px;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 120ms ease, outline-color 120ms ease;
}
[data-mg-edit]:hover {
  outline: 2px solid rgb(37, 99, 235);
  background-color: rgba(37, 99, 235, 0.08);
}
[data-mg-edit][data-mg-active] {
  outline: 2px solid rgb(37, 99, 235);
  background-color: rgba(37, 99, 235, 0.14);
}
@media (prefers-reduced-motion: reduce) {
  [data-mg-edit] { transition: none; }
}
`;

type EditTarget = {
  type: string;
  id: string;
  field: string;
  label?: string;
  fallback?: string;
};

export function EditModeOverlay() {
  const [exiting, setExiting] = useState(false);
  const inFrame = useSyncExternalStore(
    subscribeNever,
    isInFrameOnClient,
    isInFrameOnServer,
  );

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest(
        "[data-mg-edit]",
      ) as HTMLElement | null;
      if (!target) return;

      // 編集できる箇所の中にリンクやボタンがあることがある（車両カードなど）。
      // 編集モード中はそちらを優先せず、必ず編集として扱う。
      event.preventDefault();
      event.stopPropagation();

      document
        .querySelectorAll("[data-mg-active]")
        .forEach((el) => el.removeAttribute("data-mg-active"));
      target.setAttribute("data-mg-active", "");

      const payload: EditTarget = {
        type: target.dataset.mgType ?? "",
        id: target.dataset.mgId ?? "",
        field: target.dataset.mgField ?? "",
        label: target.dataset.mgLabel,
        fallback: target.dataset.mgFallback,
      };

      if (window.parent !== window) {
        window.parent.postMessage(
          { source: "mg-live-edit", kind: "select", payload },
          window.location.origin,
        );
      }
    };

    // capture段階で受ける。next/link のクリック処理より先に止める必要があるため。
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // 親フレームから「保存したので読み直して」と言われたら再読み込みする。
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.source !== "mg-live-edit-parent") return;
      if (event.data.kind === "reload") window.location.reload();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const exit = async () => {
    setExiting(true);
    await fetch("/api/admin/live-edit/session", { method: "DELETE" });
    window.location.reload();
  };

  return (
    <>
      <style>{OVERLAY_STYLE}</style>
      {/* iframeの中では管理画面側に「編集モード」の表示があるので出さない。
          公開サイトを直接開いてしまったときにだけ、抜ける手段を見せる。 */}
      {!inFrame && (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-full border border-blue-300 bg-white px-4 py-2 shadow-lg">
          <span className="text-charcoal-900 text-sm font-medium">
            編集モードで表示中
          </span>
          <button
            type="button"
            onClick={() => void exit()}
            disabled={exiting}
            className="min-h-11 rounded-full bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exiting ? "終了中..." : "終了する"}
          </button>
        </div>
      )}
    </>
  );
}
