"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AUTHOR_URL } from "@/lib/site-config";

type FooterNamespace = "result" | "stats";

export function SiteFooter({ namespace }: { namespace: FooterNamespace }) {
  const t = useTranslations(namespace);
  const tStatus = useTranslations("status");
  const [toast, setToast] = useState(false);

  return (
    <>
      <div
        className={`fixed top-6 left-1/2 z-50 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm rounded-xl bg-foreground px-4 py-3 text-center text-sm font-medium text-background shadow-lg transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        {tStatus("blocked")}
      </div>

      <footer className="flex flex-col items-center gap-2 pt-4 text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-3">
          <span>Cortex &copy; {new Date().getFullYear()}</span>
          {AUTHOR_URL && (
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground hover:underline underline-offset-4"
            >
              {t("author")}
            </a>
          )}
          <span className="footer-links text-muted-foreground/40">|</span>
          <Link
            href="/about"
            className="footer-links transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            {t("aboutLink")}
          </Link>
        </div>
      </footer>
    </>
  );
}
