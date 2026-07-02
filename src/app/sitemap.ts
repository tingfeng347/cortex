export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { SITE_URL, BASE_PATH } from "@/lib/site-config";

const BASE_URL = `${SITE_URL}${BASE_PATH}`;

const LOCALES = ["zh-CN", "en", "ja"] as const;

const STATIC_PATHS: {
  path: string;
  priority: number;
  changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1.0, changeFreq: "monthly" as const },
  { path: "/about", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/stats", priority: 0.7, changeFreq: "daily" as const },
  { path: "/share", priority: 0.8, changeFreq: "weekly" as const },
  { path: "/search", priority: 0.4, changeFreq: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFreq } of STATIC_PATHS) {
    const alternates: Record<string, string> = {};
    for (const locale of LOCALES) {
      const localePath = locale === "zh-CN" ? path : `/${locale}${path}`;
      alternates[locale] = `${BASE_URL}${localePath}`;
    }

    for (const locale of LOCALES) {
      const localePath = locale === "zh-CN" ? path : `/${locale}${path}`;
      entries.push({
        url: `${BASE_URL}${localePath}`,
        lastModified: new Date(),
        changeFrequency: changeFreq,
        priority,
        alternates: {
          languages: alternates,
        },
      });
    }
  }

  return entries;
}
