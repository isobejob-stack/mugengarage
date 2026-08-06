import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

// FR-SEO-007: クロール制御（robots.txt）。
// 管理画面（/admin）・APIルート（/api）はクロール禁止、それ以外の公開ページは許可する。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
