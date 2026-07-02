export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { SITE_URL, BASE_PATH } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}${BASE_PATH}/sitemap.xml`,
  };
}
