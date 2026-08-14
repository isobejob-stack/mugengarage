// 写真が未登録のときに使う車のシルエット。
// 一覧カード（CardImage）と車両詳細の写真枠の両方で使うため共通化している。
// 同じ「写真がない」状態を別々の絵で表すと、一覧と詳細で違う不具合に見える。
export function CarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3.5 13.5l1.4-4.3A2 2 0 0 1 6.8 7.8h10.4a2 2 0 0 1 1.9 1.4l1.4 4.3" />
      <rect x="2.5" y="13.5" width="19" height="4.5" rx="1.5" />
      <circle cx="7" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
