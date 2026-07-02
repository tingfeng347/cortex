"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/site-config";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(withBasePath("/sw.js")).catch(() => {
        // silently fail — PWA is optional
      });
    }
  }, []);

  return null;
}
