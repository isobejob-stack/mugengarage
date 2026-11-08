import type { ExternalLink } from "@/lib/settings/schema";

// 公式SNS（Instagram・Threads）への問い合わせ導線。
//
// 店主によると、問い合わせはメール・電話より InstagramのDM・Threads のほうが返信が早い（2026-11-08）。
// そのため、SNSを「フッターに並ぶリンクの1つ」ではなく、問い合わせボタンとして各所に出す。
//
// SNSのURLは管理画面の「掲載媒体・公式SNS」（site_settings.external_links）に入っている。
// 専用の列を増やさないのは、external_links が「媒体は今後増減しうるため列を増やさない」
// 方針で作られているため。ここではURLのホスト名からInstagram・Threadsを見分け、
// アカウント名を取り出して問い合わせ用のURLを組み立てる。
// 管理画面でSNSのリンクを消せば、問い合わせボタンも自動で消える。

export type InstagramContact = {
  username: string;
  profileUrl: string;
  /** DM画面を直接開くURL（Instagram公式の ig.me リンク） */
  dmUrl: string;
};

export type ThreadsContact = {
  username: string;
  profileUrl: string;
};

export type SnsContacts = {
  instagram: InstagramContact | null;
  threads: ThreadsContact | null;
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

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hostIs(url: URL, domain: string) {
  return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
}

function firstPathSegment(url: URL) {
  return url.pathname.split("/").filter(Boolean)[0] ?? "";
}

export function parseInstagramUrl(value: string): InstagramContact | null {
  const url = parseUrl(value);
  if (!url || !hostIs(url, "instagram.com")) return null;

  const username = firstPathSegment(url);
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
    dmUrl: `https://ig.me/m/${username}`,
  };
}

export function parseThreadsUrl(value: string): ThreadsContact | null {
  const url = parseUrl(value);
  if (!url || !(hostIs(url, "threads.com") || hostIs(url, "threads.net"))) {
    return null;
  }

  const segment = firstPathSegment(url);
  if (!segment.startsWith("@")) return null;
  const username = segment.slice(1);
  if (!USERNAME_PATTERN.test(username)) return null;

  return {
    username,
    profileUrl: `https://www.threads.com/@${username}`,
  };
}

// 掲載媒体・公式SNSの一覧から、最初に見つかったInstagram・Threadsを返す
export function findSnsContacts(links: ExternalLink[]): SnsContacts {
  let instagram: InstagramContact | null = null;
  let threads: ThreadsContact | null = null;

  for (const link of links) {
    instagram ??= parseInstagramUrl(link.url);
    threads ??= parseThreadsUrl(link.url);
  }

  return { instagram, threads };
}
