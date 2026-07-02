"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { parseRefParam } from "@/lib/url-utils";

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSnapshot(): number | null {
  const params = new URLSearchParams(window.location.search);
  return parseRefParam(params.get("ref") ?? undefined);
}

function getServerSnapshot(): number | null {
  return null;
}

export function AutoRedirect() {
  const t = useTranslations("share");
  const router = useRouter();
  const ref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const sp = new URLSearchParams();
    if (ref !== null) sp.set("ref", String(ref));
    router.replace("/" + (ref !== null ? "?" + sp.toString() : ""));
  }, [router, ref]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-primary/5">
        <span className="text-2xl font-bold text-primary">?</span>
      </div>
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
      {ref !== null && (
        <Link
          href={"/?ref=" + ref}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("clickHere")}
        </Link>
      )}
    </div>
  );
}
