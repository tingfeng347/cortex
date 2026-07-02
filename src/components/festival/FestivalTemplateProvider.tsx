"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  FESTIVAL_TEMPLATES,
  getActiveFestivals,
  getTemplateById,
  type FestivalTemplate,
} from "@/lib/festival-templates";

const STORAGE_KEY = "cortex-festival-template";

interface FestivalTemplateContextValue {
  activeTemplate: FestivalTemplate | null;
  availableTemplates: FestivalTemplate[];
  setActiveTemplate: (id: string | null) => void;
  clearTemplate: () => void;
}

const FestivalTemplateContext = createContext<FestivalTemplateContextValue>({
  activeTemplate: null,
  availableTemplates: FESTIVAL_TEMPLATES,
  setActiveTemplate: () => {},
  clearTemplate: () => {},
});

export function useFestivalTemplate() {
  return useContext(FestivalTemplateContext);
}

export function FestivalTemplateProvider({ children }: { children: ReactNode }) {
  const [activeTemplate, setActiveTemplateState] = useState<FestivalTemplate | null>(null);

  // Init: read localStorage (only if still in date) -> auto-detect
  useEffect(() => {
    const stored = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    })();

    let resolved: FestivalTemplate | null = null;

    if (stored) {
      const active = getActiveFestivals();
      resolved = active.find((t) => t.id === stored) ?? null;
    }

    if (!resolved) {
      const active = getActiveFestivals();
      resolved = active.length > 0 ? active[0] : null;
    }

    // Defer setState to avoid "chunk.reason.enqueueModel is not a function"
    // crash when this fires during RSC Flight stream processing on
    // client-side navigation (vercel/next.js#92362).
    const schedule =
      typeof requestIdleCallback === "function"
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 0);
    schedule(() => setActiveTemplateState(resolved));

    // Cleanup on unmount
    if (resolved) {
      return () => {
        document.documentElement.classList.remove(resolved.cssClass);
      };
    }
  }, []);

  // Sync class on <html> whenever activeTemplate changes
  useEffect(() => {
    for (const t of FESTIVAL_TEMPLATES) {
      document.documentElement.classList.remove(t.cssClass);
    }

    if (activeTemplate) {
      document.documentElement.classList.add(activeTemplate.cssClass);
    }

    return () => {
      for (const t of FESTIVAL_TEMPLATES) {
        document.documentElement.classList.remove(t.cssClass);
      }
    };
  }, [activeTemplate]);

  const setActiveTemplate = useCallback((id: string | null) => {
    const tpl = id ? (getTemplateById(id) ?? null) : null;
    setActiveTemplateState(tpl);
    try {
      if (tpl) {
        localStorage.setItem(STORAGE_KEY, tpl.id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const clearTemplate = useCallback(() => {
    setActiveTemplate(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <FestivalTemplateContext.Provider
      value={{
        activeTemplate,
        availableTemplates: FESTIVAL_TEMPLATES,
        setActiveTemplate,
        clearTemplate,
      }}
    >
      {children}
    </FestivalTemplateContext.Provider>
  );
}
