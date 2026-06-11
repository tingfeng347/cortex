"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
      setMounted(true);
    });
  }, []);

  function toggle() {
    const next = document.documentElement.classList.toggle("dark");
    setIsDark(next);
    localStorage.setItem("cortex-theme", next ? "dark" : "light");
  }

  // Avoid hydration mismatch — render nothing until mounted
  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={t("theme.toggleLabel")}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
