// FR-INV-010 / FR-VEH-003: 動画URL（YouTube等）を埋め込み表示（iframe）用のURLに変換する。
// 対応できない形式のURLの場合はnullを返し、呼び出し側で通常のリンク表示にフォールバックする。
export function toEmbeddableVideoUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com") {
    if (parsed.pathname.startsWith("/embed/")) {
      return parsed.toString();
    }
    if (parsed.pathname.startsWith("/shorts/")) {
      const videoId = parsed.pathname.split("/")[2];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    const videoId = parsed.searchParams.get("v");
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  if (host === "youtu.be") {
    const videoId = parsed.pathname.slice(1);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  return null;
}
