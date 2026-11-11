import type { ExternalLink } from "@/lib/settings/schema";

// 公式Instagramへの問い合わせ導線。
//
// 問い合わせは InstagramのDM に統一する（2026-11-08、店主の判断）。
// メール・電話よりDMのほうが返信が早いため。Instagramを使っていない人のために
// 電話とメールの窓口は併記する（components/layout/inquiry-channels.tsx）。
// LINE・Threadsは窓口を増やして複雑にしないため使わない。
//
// InstagramのURLは管理画面の「掲載媒体・公式SNS」（site_settings.external_links）に入っている。
// 専用の列を増やさないのは、external_links が「媒体は今後増減しうるため列を増やさない」
// 方針で作られているため。ここではURLのホスト名からInstagramを見分け、
// アカウント名を取り出してプロフィールのURLを組み立て直す。
// 管理画面でInstagramのリンクを消せば、問い合わせボタンも自動で消える。

export type InstagramContact = {
  username: string;
  profileUrl: string;
};

// Instagramのユーザー名に使える文字（英数字・ピリオド・アンダースコア、30文字まで）
const USERNAME_PATTERN = /^[A-Za-z0-9._]{1,30}$/;

// instagram.com/<ここ> がアカウント名ではないパス（投稿・リール等のURLが登録された場合に誤認しない）
const INSTAGRAM_RESERVED_PATHS = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "accounts",
  "direct",
  "tv",
]);

export function parseInstagramUrl(value: string): InstagramContact | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (
    url.hostname !== "instagram.com" &&
    !url.hostname.endsWith(".instagram.com")
  ) {
    return null;
  }

  const username = url.pathname.split("/").filter(Boolean)[0] ?? "";
  if (
    !USERNAME_PATTERN.test(username) ||
    INSTAGRAM_RESERVED_PATHS.has(username.toLowerCase())
  ) {
    return null;
  }

  return {
    username,
    // 共有メニューから取ったURLには追跡用のパラメータ（?igshid= 等）が付くため、組み立て直す
    profileUrl: `https://www.instagram.com/${username}/`,
  };
}

// 掲載媒体・公式SNSの一覧から、最初に見つかったInstagramを返す
export function findInstagramContact(
  links: ExternalLink[],
): InstagramContact | null {
  for (const link of links) {
    const contact = parseInstagramUrl(link.url);
    if (contact) return contact;
  }
  return null;
}

// Instagramのボタンの行き先と開き方（2026-11-11 改訂）。
//
// 以前はスマホで DM の短縮リンク（ig.me/m/<アカウント>）を開いていたが、iPhone の Chrome で
// 「アプリが入っているのに App Store が開く」「読み込み中のまま止まる」と報告があった。
// 原因は次の2つが重なったことと考えられる。
// - ig.me は instagram.com へ転送するだけの短縮リンクで、iOS がアプリに引き渡すのは
//   アプリに紐付いたドメイン（instagram.com）を直接タップしたときだけ。転送を挟むと、
//   特に Safari 以外のブラウザではアプリに渡らず、Instagram のWebページ側の
//   「アプリで開く → 開けなければ App Store へ」という処理に流れる
// - 外部リンクを新しいタブ（target="_blank"）で開いていた。アプリに引き渡すと
//   開いた側のタブが空のまま残り、「読み込み中のまま」に見える
// そこで、どの端末でもプロフィール（instagram.com/<アカウント>/）を直接開き、
// スマホでは同じタブで開く（ふつうのリンクのタップとして扱われ、アプリが入っていればアプリが開く）。
// DMはプロフィールの「メッセージ」から1タップで進める。パソコンでは今のページを残すため新しいタブで開く。
//
// iPadOS は既定で Mac と同じ userAgent を名乗るため、タッチ操作の可否であわせて見分ける。
export function isMobileDevice(userAgent: string, maxTouchPoints = 0): boolean {
  if (/iPhone|iPad|iPod|Android/i.test(userAgent)) return true;
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

export function instagramLinkFor(
  contact: InstagramContact,
  isMobile: boolean,
): { href: string; target: "_self" | "_blank" } {
  return {
    href: contact.profileUrl,
    target: isMobile ? "_self" : "_blank",
  };
}
