"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

const ACCEPT_LANG_MAP: Record<string, string> = {
  zh: "zh-CN",
  en: "en",
  ja: "ja",
};

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let locale: string | null = null;

    // Check NEXT_LOCALE cookie first
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (match && routing.locales.includes(match[1] as never)) {
      locale = match[1];
    }

    // Fallback: browser language
    if (!locale) {
      for (const lang of navigator.languages ?? [navigator.language]) {
        const code = lang.split("-")[0].trim().slice(0, 2);
        const mapped = ACCEPT_LANG_MAP[code];
        if (mapped) {
          locale = mapped;
          break;
        }
      }
    }

    if (!locale || !routing.locales.includes(locale as never)) {
      locale = routing.defaultLocale;
    }

    router.replace(`/${locale}`);
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 text-sm text-muted-foreground">
      Loading...
    </div>
  );
}
