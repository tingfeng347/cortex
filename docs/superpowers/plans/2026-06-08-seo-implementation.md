# SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehensive SEO to Cognitive Rustproof — technical foundation, content engine, social sharing, and multilingual optimization.

**Architecture:** Next.js 16 App Router conventions for robots/sitemap/metadata. Article content lives in existing i18n message JSON files (no new deps). Stats page split into server wrapper + client component. All pages get per-locale metadata, hreflang alternates, and JSON-LD structured data.

**Tech Stack:** Next.js 16.2, next-intl 4.11, @vercel/og, TypeScript 5, Tailwind CSS 4

---

### Task 1: robots.txt

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create robots.ts**

Next.js App Router convention — any file at `app/robots.ts` that exports a `Robots` object or a function returning one is served at `/robots.txt`.

```typescript
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: "https://cortex.hydroroll.team/sitemap.xml",
  }
}
```

- [ ] **Step 2: Verify with dev server**

Run: `pnpm dev`
Test: `curl -s http://localhost:3000/robots.txt`
Expected output:
```
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://cortex.hydroroll.team/sitemap.xml
```

- [ ] **Step 3: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: add robots.txt"
```

---

### Task 2: sitemap.xml

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create sitemap.ts**

Next.js convention — `app/sitemap.ts` exporting `sitemap()` is served at `/sitemap.xml`.

The sitemap needs all locale×path combinations with hreflang alternates. `next-intl` routing uses `as-needed` prefix so default locale (zh-CN) paths omit the prefix, while en/ja include it.

```typescript
import type { MetadataRoute } from "next"

const BASE_URL = "https://cortex.hydroroll.team"

const LOCALES = ["zh-CN", "en", "ja"] as const

// All pages without locale prefix logic — the sitemap uses explicit locale segments
// since next-intl's localePrefix: "as-needed" means zh-CN has no prefix at runtime,
// but for sitemap hreflang we always use explicit locale paths for clarity.
const STATIC_PATHS: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, changeFreq: "monthly" as const },
  { path: "/about", priority: 0.5, changeFreq: "monthly" as const },
  { path: "/stats", priority: 0.7, changeFreq: "daily" as const },
  { path: "/share", priority: 0.8, changeFreq: "weekly" as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority, changeFreq } of STATIC_PATHS) {
    const alternates: Record<string, string> = {}
    for (const locale of LOCALES) {
      const localePath = locale === "zh-CN" ? path : `/${locale}${path}`
      alternates[locale] = `${BASE_URL}${localePath}`
    }

    for (const locale of LOCALES) {
      const localePath = locale === "zh-CN" ? path : `/${locale}${path}`
      entries.push({
        url: `${BASE_URL}${localePath}`,
        lastModified: new Date(),
        changeFrequency: changeFreq,
        priority,
        alternates: {
          languages: alternates,
        },
      })
    }
  }

  return entries
}
```

- [ ] **Step 2: Verify with dev server**

Run: `pnpm dev`
Test: `curl -s http://localhost:3000/sitemap.xml | head -40`
Expected: XML sitemap with `<url>` entries, each having `<xhtml:link rel="alternate" hreflang="...">` entries.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: add multilingual sitemap.xml with hreflang alternates"
```

---

### Task 3: Structured Data + hreflang in Layout

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Add JSON-LD and hreflang alternates to locale layout**

We inject a `<script>` tag with JSON-LD `WebApplication` schema, and add `alternates.languages` to the existing `generateMetadata`.

```typescript
import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { QUESTIONS_PER_TEST } from "@/lib/questions"
import { RESULT_TIERS } from "@/lib/scoring"

const OG_DEFAULT_TIER_LABEL = RESULT_TIERS[Math.floor(RESULT_TIERS.length / 2)].label

const BASE_URL = "https://cortex.hydroroll.team"

function jsonLdWebApplication(locale: string) {
  const inLanguage = locale === "zh-CN" ? "zh-Hans" : locale === "ja" ? "ja" : "en"
  const name: Record<string, string> = {
    "zh-CN": "认知防锈 · 基线测试",
    en: "Cognitive Rustproof · Baseline Test",
    ja: "認知防錆 · ベースラインテスト",
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: name[locale] ?? name["zh-CN"],
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url: BASE_URL,
    inLanguage,
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "site" })
  const ogImgUrl = `/api/og?i=50&t=${encodeURIComponent(OG_DEFAULT_TIER_LABEL)}&c=0&n=${QUESTIONS_PER_TEST}`

  return {
    title: t("title") + " | " + t("tagline"),
    description: t("description", { count: QUESTIONS_PER_TEST }),
    manifest: `/${locale}/manifest.json`,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: locale === "zh-CN" ? BASE_URL : `${BASE_URL}/${locale}`,
      languages: {
        "zh-Hans": `${BASE_URL}/`,
        en: `${BASE_URL}/en`,
        ja: `${BASE_URL}/ja`,
      },
    },
    openGraph: {
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: QUESTIONS_PER_TEST }),
      type: "website",
      siteName: "Cognitive Rustproof",
      locale: locale === "zh-CN" ? "zh_CN" : locale === "ja" ? "ja_JP" : "en_US",
      images: [
        {
          url: ogImgUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: QUESTIONS_PER_TEST }),
      images: [ogImgUrl],
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdWebApplication(locale)),
        }}
      />
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <ServiceWorkerRegister />
      {children}
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 2: Update root layout — add og:locale:alternate**

```typescript
// In src/app/layout.tsx, update metadata to include openGraph alternates
export const metadata: Metadata = {
  metadataBase: new URL("https://cortex.hydroroll.team"),
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    "theme-color": "#1a1a1a",
  },
  openGraph: {
    locale: "zh_CN",
    alternateLocale: ["en_US", "ja_JP"],
  },
}
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`
- Visit `http://localhost:3000/` → view page source → confirm JSON-LD script is present
- Confirm `<link rel="alternate" hreflang="...">` tags appear in `<head>`

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/layout.tsx src/app/layout.tsx
git commit -m "feat: add JSON-LD structured data and hreflang alternates to layouts"
```

---

### Task 4: About Page Metadata

**Files:**
- Modify: `src/app/[locale]/about/page.tsx`

- [ ] **Step 1: Add generateMetadata to about page**

The about page currently has no metadata export. Add one before the default export.

```typescript
import { type Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "about" })
  const ogUrl = `/api/og?i=50&t=moderateDecline&c=?&n=5`

  return {
    title: t("title") + " · Cognitive Rustproof",
    description: t("originP1").slice(0, 160),
    openGraph: {
      title: t("title") + " · Cognitive Rustproof",
      description: t("originP1").slice(0, 160),
      type: "article",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " · Cognitive Rustproof",
      description: t("originP1").slice(0, 160),
      images: [ogUrl],
    },
  }
}
```

This goes right after the imports and before `export default async function AboutPage`.

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Visit `http://localhost:3000/about` → view source. Title tag should show "关于 · Cognitive Rustproof" (zh-CN) and OG tags should be present.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/about/page.tsx
git commit -m "feat: add generateMetadata to about page"
```

---

### Task 5: Stats Page Server Wrapper

**Files:**
- Create: `src/app/[locale]/stats/page.tsx` (replace)
- Create: `src/components/stats-content.tsx` (rename current stats page body)

- [ ] **Step 1: Extract client content from current stats page**

The current `stats/page.tsx` is `"use client"`. We need a server wrapper for `generateMetadata`. The cleanest approach: keep the current page as `stats-content.tsx` (a client component) and create a thin server component at `page.tsx`.

Rename the current `src/app/[locale]/stats/page.tsx` → `src/components/stats-content.tsx` with two changes:
1. Remove the outer `<div className="min-h-dvh...">` wrapper (it goes in the server wrapper)
2. Accept data as optional prop for optional SSR preload

```bash
cp src/app/[locale]/stats/page.tsx src/components/stats-content.tsx
```

Then edit `src/components/stats-content.tsx`:

- Remove the outer `<div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">` and its closing `</div>`
- Remove the inner `<div className="mx-auto max-w-2xl p-4 md:p-8">` wrapper and its closing `</div>` (the server wrapper provides these)
- Change `export default function StatsPage()` → add props interface and export:

```typescript
interface StatsContentProps {
  initialData?: StatsPageData | null
}

export default function StatsContent({ initialData }: StatsContentProps) {
  // ... existing logic, but use initialData if provided for SSR
```

Actually, since the stats data comes from a client-side `fetch("/api/stats")` and the page needs localStorage access for user history, the simpler approach is: keep the client component exactly as-is but strip the outer wrappers, then the server page just provides metadata and wraps the client component.

Let me keep this simpler. The server page is thin:

```typescript
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import StatsContent from "@/components/stats-content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "stats" })
  const ogUrl = `/api/og?i=50&t=moderateDecline&c=?&n=5`

  return {
    title: t("pageTitle") + " · Cognitive Rustproof",
    description: t("pageSubtitle"),
    openGraph: {
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      images: [ogUrl],
    },
  }
}

export default function StatsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <StatsContent />
      </div>
    </div>
  )
}
```

The existing client component moves to `src/components/stats-content.tsx` — copy the body of the current stats page (everything inside the outer divs), keeping `"use client"` directive. Remove the outer layout divs since the server wrapper provides them now. Remove the page-level header div (the one with ArrowLeft + page title) since we move that to the server wrapper too… 

Actually, the simplest approach: just add `generateMetadata` by using a parallel server file pattern. Next.js doesn't support this easily without splitting. Let me do the clean split:

**new `src/app/[locale]/stats/page.tsx`** — server component, exports metadata + renders a client wrapper:

```typescript
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import StatsClient from "./stats-client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "stats" })
  const ogUrl = `/api/og?i=50&t=moderateDecline&c=?&n=5`

  return {
    title: t("pageTitle") + " · Cognitive Rustproof",
    description: t("pageSubtitle"),
    openGraph: {
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      images: [ogUrl],
    },
  }
}

export default function StatsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <StatsClient />
      </div>
    </div>
  )
}
```

**new `src/app/[locale]/stats/stats-client.tsx`** — the current `page.tsx` content, unchanged except:
- Remove the outer `<div className="min-h-dvh...">` and `max-w-2xl` wrapper divs (they're now in page.tsx)
- Remove the header block with ArrowLeft and page title (move to page.tsx)

Wait, this is getting complicated. Let me take the simplest approach that works:

1. `page.tsx` is the server component with metadata + page chrome (outer divs, header)
2. `stats-client.tsx` is `"use client"` with the data fetching and visualization logic

Let me write the implementation steps more clearly with actual code.

- [ ] **Step 1: Create `src/app/[locale]/stats/stats-client.tsx`**

This is the current `page.tsx` but stripped of:
- The outer layout divs (`.min-h-dvh` wrapper and `.max-w-2xl` inner)
- The header section (ArrowLeft + page title)

Keep everything from `const [data, setData] = ...` through the footer. Keep `"use client"`.

Since the full file is ~600 lines, I'll describe the transformation precisely:

From current `page.tsx`, copy everything starting from `const t = useTranslations("stats")` through the end of the component. Remove the outer two wrapper divs. Export as `StatsClient`.

```typescript
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DistributionChart from "@/components/distribution-chart";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Users, Brain, BarChart3 } from "lucide-react";
import { TIER_COLOR_MAP, TIER_KEYS } from "@/lib/scoring";
import { AI_CANONICAL_LEVELS } from "@/lib/constants";

// ... (all interfaces remain the same)
interface StatsPageData {
  totalTests: number;
  avgDegradation: number | null;
  distribution: number[];
  tierCounts: Record<string, number>;
  aiUsageCounts: Record<string, number>;
  irtCount: number;
  pctCount: number;
  countryCounts: Record<string, number>;
}

interface HistoryEntry {
  degradationIndex: number;
  timestamp: number;
  dimensionScores?: {
    logic: number | null;
    math: number | null;
    vocab: number | null;
  };
  tierColor?: string;
}

interface UserResult {
  degradationIndex: number;
  tierLabel: string;
  tier: { label: string; color?: string };
}

export default function StatsClient() {
  const t = useTranslations("stats");
  const tierLabel = useTranslations("tier");
  const decl = useTranslations("declaration");

  const [data, setData] = useState<StatsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<UserResult["tier"] | null>(null);
  const [trendDimension, setTrendDimension] = useState<
    "overall" | "logic" | "math" | "vocab"
  >("overall");

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((json) => {
        setData(json as StatsPageData);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });

    try {
      const raw = localStorage.getItem("cognitive-rust-history");
      if (raw) {
        const parsed: HistoryEntry[] = JSON.parse(raw);
        setHistory(parsed);
      }
      const resultRaw = localStorage.getItem("cognitive-rust-result");
      if (resultRaw) {
        const parsed: UserResult = JSON.parse(resultRaw);
        setUserScore(parsed.degradationIndex);
        setUserTier(parsed.tier);
      }
    } catch {
      // ignore
    }
  }, []);

  // ... rest of the component body (loading, error, empty, data, trend sections)
  // ALL of it stays the same, just not the outer wrappers or header
  return (
    <>
      {loading && (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          {t("loading")}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("errorTitle")}</p>
            <Link
              href="/"
              className="text-sm text-primary underline-offset-4 hover:underline mt-4 inline-block"
            >
              {t("emptyCta")}
            </Link>
          </CardContent>
        </Card>
      )}

      {data && !loading && data.totalTests === 0 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>{t("emptyTitle")}</CardTitle>
            <CardDescription className="mt-2">
              {t("emptyDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-8 px-2.5"
            >
              {t("emptyCta")}
            </Link>
          </CardContent>
        </Card>
      )}

      {data && !loading && data.totalTests > 0 && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* ... all summary cards, distribution chart, AI breakdown, tier breakdown ... */}
            {/* COPY ALL OF THIS FROM CURRENT page.tsx, unchanged */}
          </div>
        </div>
      )}

      {history.length >= 2 && (
        <Card className="mt-6">
          {/* ... trend chart ... */}
          {/* COPY ALL OF THIS FROM CURRENT page.tsx, unchanged */}
        </Card>
      )}

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>{t("privacyNote")}</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <Link
            href="/about"
            className="transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            {t("aboutLink")}
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <a
            href="https://deadpan.hydroroll.team"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            {t("otherGame")}
          </a>
          <span className="text-muted-foreground/40">|</span>
          <a
            href="https://ddlroast.hydroroll.team"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            {t("ddlRoast")}
          </a>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Replace `src/app/[locale]/stats/page.tsx` with server wrapper**

```typescript
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import StatsClient from "./stats-client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "stats" })
  const ogUrl = `/api/og?i=50&t=moderateDecline&c=?&n=5`

  return {
    title: t("pageTitle") + " · Cognitive Rustproof",
    description: t("pageSubtitle"),
    openGraph: {
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      images: [ogUrl],
    },
  }
}

export default function StatsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              <StatsClient.Title />
            </h1>
            <p className="text-xs text-muted-foreground">
              <StatsClient.Subtitle />
            </p>
          </div>
        </div>

        <StatsClient />
      </div>
    </div>
  )
}
```

Hmm, the header has translated text. We need a pattern that works without duplicating translations. Simplest approach: move the header into the client component too, keep page.tsx as thin metadata-only:

```typescript
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import StatsClient from "./stats-client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "stats" })
  const ogUrl = `/api/og?i=50&t=moderateDecline&c=?&n=5`

  return {
    title: t("pageTitle") + " · Cognitive Rustproof",
    description: t("pageSubtitle"),
    openGraph: {
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      type: "website",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("pageTitle") + " · Cognitive Rustproof",
      description: t("pageSubtitle"),
      images: [ogUrl],
    },
  }
}

export default function StatsPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <StatsClient />
      </div>
    </div>
  )
}
```

And `stats-client.tsx` starts with the header:

```typescript
"use client";

import { useEffect, useState } from "react";
// ... all imports ...
import { ArrowLeft, Users, Brain, BarChart3 } from "lucide-react";

// ... interfaces ...

export default function StatsClient() {
  const t = useTranslations("stats");
  // ...

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {t("pageTitle")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
      </div>

      {/* ... rest of content unchanged ... */}
    </>
  );
}
```

This is much cleaner. The server page just wraps in layout + provides metadata.

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Visit `http://localhost:3000/stats` → page should look and function identically. View source → `<title>` should show stats page title.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/stats/
git commit -m "feat: add server-side metadata to stats page"
```

---

### Task 6: Custom 404 Page

**Files:**
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create not-found.tsx**

Use `next-intl` aware not-found page that links back to home for all locales.

```typescript
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4"
      >
        Go back home
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`
Visit `http://localhost:3000/nonexistent-page` → should show custom 404, not the Next.js default.

- [ ] **Step 3: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: add custom 404 page"
```

---

### Task 7: Article List Page

**Files:**
- Create: `src/app/[locale]/articles/page.tsx`
- Modify: `src/messages/en.json`, `src/messages/zh-CN.json`, `src/messages/ja.json` (add `articles` namespace)

- [ ] **Step 1: Add article list translations to message files**

Add `articles` namespace to each locale's JSON. First, read the current JSON and append.

In `src/messages/en.json`, add after the last closing brace of the last namespace:

```json
"articles": {
  "list": {
    "title": "Articles",
    "subtitle": "Explore the science behind cognitive health, AI dependency, and independent thinking.",
    "readMore": "Read more",
    "cta": "Take the test",
    "publishedOn": "Published",
    "backToTest": "Back to Test",
    "intro": "Thoughts on cognitive health, AI dependency, and reclaiming independent thinking."
  }
}
```

In `src/messages/zh-CN.json`:

```json
"articles": {
  "list": {
    "title": "文章",
    "subtitle": "探索认知健康、AI 依赖和独立思考背后的科学。",
    "readMore": "阅读全文",
    "cta": "去测试",
    "publishedOn": "发布于",
    "backToTest": "返回测试",
    "intro": "关于认知健康、AI 依赖和找回独立思考的思考。"
  }
}
```

In `src/messages/ja.json`:

```json
"articles": {
  "list": {
    "title": "記事",
    "subtitle": "認知の健康、AI依存、そして独立した思考の科学を探る。",
    "readMore": "続きを読む",
    "cta": "テストを受ける",
    "publishedOn": "公開日",
    "backToTest": "テストに戻る",
    "intro": "認知の健康、AI依存、そして独立した思考を取り戻すことについて。"
  }
}
```

- [ ] **Step 2: Create article list page component**

The page renders a list of articles with title, excerpt, and date.

```typescript
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const ARTICLES = [
  {
    slug: "ai-making-you-dumber",
    date: "2026-06-08",
  },
  {
    slug: "brain-fitness-guide",
    date: "2026-06-08",
  },
  {
    slug: "how-cognitive-test-works",
    date: "2026-06-08",
  },
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "articles.list" })

  return {
    title: t("title") + " · Cognitive Rustproof",
    description: t("intro"),
    openGraph: {
      title: t("title") + " · Cognitive Rustproof",
      description: t("intro"),
      type: "website",
    },
  }
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "articles.list" })
  const articleT = await getTranslations({ locale, namespace: "articles" })

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("intro")}</p>
          </div>
        </div>

        <div className="space-y-4">
          {ARTICLES.map((article) => {
            const title = articleT.raw(`${article.slug}.title`) as string
            const excerpt = articleT.raw(`${article.slug}.excerpt`) as string
            return (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="block rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <h2 className="text-base font-semibold text-foreground">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {excerpt}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t("publishedOn")} {article.date}
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {t("readMore")} →
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4"
          >
            {t("cta")}
          </Link>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline underline-offset-4">
            {t("backToTest")}
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify page renders**

Run: `pnpm dev`
Visit `http://localhost:3000/articles` → should show article list with 3 cards.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/articles/page.tsx src/messages/
git commit -m "feat: add article list page with i18n translations"
```

---

### Task 8: Article Detail Page + Content

**Files:**
- Create: `src/app/[locale]/articles/[slug]/page.tsx`
- Modify: `src/messages/en.json`, `src/messages/zh-CN.json`, `src/messages/ja.json` (add per-article content)

- [ ] **Step 1: Add article body content to message files**

Add `articles.ai-making-you-dumber`, `articles.brain-fitness-guide`, `articles.how-cognitive-test-works` to each locale's message JSON. Each article has `title`, `excerpt`, `body` (array of HTML paragraphs).

In `src/messages/en.json`, add after `articles.list`:

```json
"ai-making-you-dumber": {
  "title": "Is AI Making You Dumber?",
  "excerpt": "A 5-minute cognitive snapshot that reveals what AI has left on your brain.",
  "body": [
    "<p>Since 2024, a quiet shift has happened. The first instinct when facing a hard problem is no longer 'let me think' — it's 'let me ask.' This shift is comfortable. It's also unsettling.</p>",
    "<h2>The 'Use It or Lose It' Problem</h2>",
    "<p>Cognitive ability works like a muscle. When you outsource thinking, the muscle atrophies. This isn't speculation — it's a well-established principle in cognitive neuroscience. The brain strengthens neural pathways it uses and prunes the ones it doesn't.</p>",
    "<p>AI tools are incredible. They make us faster, more productive, and more capable. But when we use them to <em>replace</em> thinking rather than <em>augment</em> it, something is lost. The question is: how much?</p>",
    "<h2>Making the Invisible Visible</h2>",
    "<p>That's why we built Cognitive Rustproof. It's not an IQ test. It's a baseline measurement of your current cognitive state — a snapshot of how well your brain works when there's no AI to help.</p>",
    "<p>20 questions. 40 seconds each. Logic, mental math, vocabulary. No AI assistance allowed. At the end, you get a 'degradation index' — a number between 0 and 100. Lower is better.</p>",
    "<h2>The Real Value Is the Trend</h2>",
    "<p>One score tells you little. Two scores, taken weeks apart, tell you everything. Is your index going up? That's a signal. Is it going down? Also a signal. Trends matter more than snapshots.</p>",
    "<p>Think of it like stepping on a scale — except it measures cognitive activity, not body weight. The point isn't to judge. The point is to see.</p>",
    "<div style='margin-top:2rem;text-align:center'><a href='/' style='display:inline-block;padding:10px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:500'>Take the Test →</a></div>"
  ]
},
"brain-fitness-guide": {
  "title": "Brain Fitness: Reclaim Independent Thinking in 7 Days",
  "excerpt": "Seven daily habits to rebuild cognitive independence, whether you're showing early signs of AI dependency or just want to stay sharp.",
  "body": [
    "<p>Cognitive ability is like a muscle — use it or lose it. When AI does your thinking for you, neural pathways weaken. The good news: they can be rebuilt. Here's a 7-day program to reclaim independent thinking.</p>",
    "<h2>Day 1: The 'Think First' Rule</h2>",
    "<p>Before opening ChatGPT, Claude, or any AI tool, spend 60 seconds thinking independently. Write down your own answer first — even if it's incomplete. This simple habit creates a mental checkpoint that prevents automatic outsourcing of thinking.</p>",
    "<h2>Day 2: Read a Physical Book for 20 Minutes</h2>",
    "<p>No screens. No notifications. Just you and printed words. Physical reading activates different neural circuits than scrolling — it demands sustained attention, linear reasoning, and active imagination. Pick something slightly challenging.</p>",
    "<h2>Day 3: Do Mental Math</h2>",
    "<p>Calculate your grocery total before reaching the register. Split the dinner bill without your phone. Multiply two-digit numbers in your head while waiting for coffee. Mental math is one of the first cognitive skills to atrophy with calculator/AI dependency.</p>",
    "<h2>Day 4: Write 500 Words Without AI Assistance</h2>",
    "<p>No grammar checkers. No AI suggestions. No rewriting tools. Just you and a blank page. Write about something you care about. The goal isn't quality — it's the act of organizing thoughts into words without algorithmic assistance.</p>",
    "<h2>Day 5: Solve a Logic Puzzle</h2>",
    "<p>Sudoku. A chess problem. A riddle. A coding challenge on paper. Something that requires multi-step reasoning. Don't reach for hints. Sit with the discomfort of not knowing — this is where cognitive growth happens.</p>",
    "<h2>Day 6: Have a Deep Conversation</h2>",
    "<p>Talk to someone for an hour — no phones, no distractions. Argue a point. Explain something complex. Listen carefully and respond thoughtfully. Real-time conversation is the ultimate cognitive workout: you must think, process, and articulate simultaneously.</p>",
    "<h2>Day 7: Retest and Reflect</h2>",
    "<p>Take the Cognitive Rustproof test again. Compare your score to baseline. Did it change? What felt different this time? The number matters less than your awareness of it. Trends > snapshots.</p>",
    "<p>Cognitive fitness isn't about rejecting AI — it's about maintaining the choice to think independently when it matters. Keep measuring. Keep noticing.</p>",
    "<div style='margin-top:2rem;text-align:center'><a href='/' style='display:inline-block;padding:10px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:500'>Check Your Baseline →</a></div>"
  ]
},
"how-cognitive-test-works": {
  "title": "How IRT-Based Cognitive Testing Actually Works",
  "excerpt": "Behind the 20 questions is an Item Response Theory engine that adapts to your ability level. Here's how it produces a meaningful score.",
  "body": [
    "<p>Most online tests give you a fixed set of questions and a percentage score. Cognitive Rustproof does something different — it uses Item Response Theory (IRT), the same framework behind SAT, GRE, and professional certification exams.</p>",
    "<h2>What Is IRT?</h2>",
    "<p>Item Response Theory models the probability of a correct answer based on two things: the person's ability (theta) and the question's characteristics (difficulty, discrimination). Unlike percentage-correct scoring, IRT accounts for <em>which</em> questions you got right, not just <em>how many</em>.</p>",
    "<p>Getting an easy question wrong hurts your score more than missing a hard one. Getting a hard question right boosts your score more than acing an easy one. This makes the score more informative than a simple percentage.</p>",
    "<h2>The Three Dimensions</h2>",
    "<p>The test covers three cognitive domains:</p>",
    "<ul><li><strong>Logic Reasoning</strong> — pattern recognition, logical deduction, sequential thinking</li><li><strong>Mental Math</strong> — arithmetic fluency, numerical estimation, computational speed</li><li><strong>Vocabulary</strong> — word knowledge, semantic understanding, verbal reasoning</li></ul>",
    "<p>Each dimension is calibrated independently, and the test rotates through them to build a balanced profile.</p>",
    "<h2>Adaptive Question Selection</h2>",
    "<p>As you answer questions, the system updates its estimate of your ability and selects the next question to maximize information gain. This is called EAP (Expected A Posteriori) estimation with Fisher information maximization.</p>",
    "<p>In plain English: the test gets harder when you're doing well and easier when you're struggling — not to be cruel or kind, but because questions near your ability level provide the most information.</p>",
    "<h2>From Theta to Degradation Index</h2>",
    "<p>Your final theta estimate is mapped to a percentile using the normal distribution (standard normal CDF). The degradation index is simply 100 minus your percentile. A score of 50 means you're at the population average. A score of 10 means you're in the top 10%.</p>",
    "<h2>Why Trends Matter</h2>",
    "<p>No test is perfect. Measurement error exists. That's why we emphasize retesting — the trend across multiple measurements is far more reliable than any single score. Think of it like tracking your weight: one reading tells you little, but the trend over time tells you everything.</p>",
    "<p>The goal isn't a number. It's awareness. Because what you can't measure, you won't improve.</p>",
    "<div style='margin-top:2rem;text-align:center'><a href='/' style='display:inline-block;padding:10px 24px;background:#111;color:#fff;border-radius:8px;text-decoration:none;font-weight:500'>Take the Test →</a></div>"
  ]
}
```

Articles 2 and 3 in zh-CN and ja need human-written translations added to `zh-CN.json` and `ja.json` following the same JSON structure. The prose should be natural in each language, not machine-translated.

- [ ] **Step 1b: Add zh-CN article content**

Write Chinese translations for all 3 articles in `src/messages/zh-CN.json` under the `articles` namespace, using the same `{slug}.title`, `{slug}.excerpt`, `{slug}.body` structure shown above.

- [ ] **Step 1c: Add ja article content**

Write Japanese translations for all 3 articles in `src/messages/ja.json` under the `articles` namespace, using the same structure.

- [ ] **Step 2: Create article detail page**

```typescript
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

const ARTICLES = [
  "ai-making-you-dumber",
  "brain-fitness-guide",
  "how-cognitive-test-works",
] as const

const BASE_URL = "https://cortex.hydroroll.team"

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const locale of ["zh-CN", "en", "ja"]) {
    for (const slug of ARTICLES) {
      params.push({ locale, slug })
    }
  }
  return params
}

function articleJsonLd(title: string, excerpt: string, locale: string, slug: string) {
  const inLanguage = locale === "zh-CN" ? "zh-Hans" : locale === "ja" ? "ja" : "en"
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: excerpt,
    author: { "@type": "Person", name: "Hsiang Nianian" },
    datePublished: "2026-06-08",
    dateModified: "2026-06-08",
    url: `${BASE_URL}${locale === "zh-CN" ? "" : `/${locale}`}/articles/${slug}`,
    inLanguage,
    publisher: { "@type": "Organization", name: "Cognitive Rustproof", url: BASE_URL },
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!ARTICLES.includes(slug as (typeof ARTICLES)[number])) return {}

  const t = await getTranslations({ locale, namespace: "articles" })
  const title = t.raw(`${slug}.title`) as string
  const excerpt = t.raw(`${slug}.excerpt`) as string

  const ogUrl = `/api/og?i=50&t=moderateDecline&c=?&n=5`

  return {
    title: title + " · Cognitive Rustproof",
    description: excerpt,
    alternates: {
      canonical: `${BASE_URL}${locale === "zh-CN" ? "" : `/${locale}`}/articles/${slug}`,
      languages: {
        "zh-Hans": `${BASE_URL}/articles/${slug}`,
        en: `${BASE_URL}/en/articles/${slug}`,
        ja: `${BASE_URL}/ja/articles/${slug}`,
      },
    },
    openGraph: {
      title: title + " · Cognitive Rustproof",
      description: excerpt,
      type: "article",
      publishedTime: "2026-06-08",
      authors: ["Hsiang Nianian"],
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: title + " · Cognitive Rustproof",
      description: excerpt,
      images: [ogUrl],
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  if (!ARTICLES.includes(slug as (typeof ARTICLES)[number])) notFound()

  const t = await getTranslations({ locale, namespace: "articles" })
  const listT = await getTranslations({ locale, namespace: "articles.list" })
  const title = t.raw(`${slug}.title`) as string
  const excerpt = t.raw(`${slug}.excerpt`) as string
  const body = t.raw(`${slug}.body`) as string[]

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/articles">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          </div>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(articleJsonLd(title, excerpt, locale, slug)),
            }}
          />
          <div
            dangerouslySetInnerHTML={{
              __html: body.join("\n"),
            }}
          />
        </article>

        <div className="mt-12 rounded-xl border bg-card p-6 text-center">
          <h2 className="text-base font-semibold">
            {t.raw("list.cta") as string}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {excerpt}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium h-9 px-4"
          >
            {t.raw("list.cta") as string}
          </Link>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <Link href="/articles" className="hover:underline underline-offset-4">
            ← {listT("title")}
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add prose styles**

The article page uses `prose` classes from Tailwind Typography. Check if it's available:

```bash
grep -r "prose" node_modules/tailwindcss/package.json || echo "Need @tailwindcss/typography"
```

If not installed:
```bash
pnpm add @tailwindcss/typography
```

And add to CSS:

In `src/app/globals.css`, add:
```css
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`
Visit `http://localhost:3000/articles/ai-making-you-dumber` → should render article with prose styling and JSON-LD.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/articles/ src/messages/ src/app/globals.css package.json pnpm-lock.yaml
git commit -m "feat: add article detail pages with JSON-LD structured data"
```

---

### Task 9: Social Sharing Enhancement

**Files:**
- Modify: `src/app/[locale]/share/page.tsx` — enhance metadata with challenge copy
- Modify: `src/app/api/og/route.tsx` — add challenge text to OG images

- [ ] **Step 1: Add challenge copy generation helper**

Add to `src/lib/scoring.ts` a function that returns share-optimized text per tier:

```typescript
export function getChallengeCopy(tierKey: string, index: number): string {
  const challenges: Record<string, string> = {
    cognitivePeak: `I scored ${index}/100 — cognitive peak. Think you can beat me?`,
    mildDecline: `I scored ${index}/100 on the cognitive rust test. Can you do better?`,
    moderateDecline: `AI might be making me rusty. I scored ${index}/100. What's your score?`,
    significantDecline: `OK this is concerning. I got ${index}/100. Time to see where you stand.`,
    severeDecline: `The AI brain rust is real. ${index}/100. Dare to test yourself?`,
  }
  return challenges[tierKey] ?? challenges.moderateDecline
}
```

- [ ] **Step 2: Update share page metadata to use challenge copy**

In `src/app/[locale]/share/page.tsx`, update `generateMetadata`:

```typescript
import { getTierByIndex, getChallengeCopy } from "@/lib/scoring"

export async function generateMetadata({
  searchParams,
  params,
}: {
  searchParams: Promise<{ ref?: string }>
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const sp = await searchParams
  const ref = sp.ref
  const index = ref ? Math.min(100, Math.max(0, Number(ref) || 50)) : 50
  const tier = getTierByIndex(index)
  const t = await getTranslations({ locale, namespace: "site" })

  const challengeCopy = getChallengeCopy(tier.tierKey, index)
  const ogUrl = `/api/og?i=${index}&t=${encodeURIComponent(tier.tierKey)}&c=?&n=5`

  return {
    title: t("title") + " — " + tier.label,
    description: challengeCopy,
    openGraph: {
      title: t("title") + " — " + tier.label,
      description: challengeCopy,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " — " + tier.label,
      description: challengeCopy,
      images: [ogUrl],
    },
  }
}
```

- [ ] **Step 3: Update OG image to show challenge text**

In `src/app/api/og/route.tsx`, add optional `challenge` query param support. When present, show the challenge line below the score.

Add below the tier badge div in the JSX:

```typescript
const challengeText = searchParams.get("challenge") ?? ""

// After the tier badge div, add:
{challengeText && (
  <div style={{ marginTop: "20px", fontSize: "20px", color: "#444", textAlign: "center", maxWidth: "600px" }}>
    {challengeText}
  </div>
)}
```

- [ ] **Step 4: Update share page to pass challenge text to OG URL**

In the share page, build the OG URL with the challenge query:

```typescript
const ogUrl = `/api/og?i=${index}&t=${encodeURIComponent(tier.tierKey)}&c=?&n=5&challenge=${encodeURIComponent(challengeCopy)}`
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts src/app/[locale]/share/page.tsx src/app/api/og/route.tsx
git commit -m "feat: add challenge copy to social share metadata and OG images"
```

---

### Task 10: Vercel Analytics Setup

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install @vercel/analytics**

```bash
pnpm add @vercel/analytics
```

- [ ] **Step 2: Add Analytics component**

In `src/app/layout.tsx`, import and render the Analytics component:

Add import:
```typescript
import { Analytics } from "@vercel/analytics/react"
```

Add `<Analytics />` before `{children}` in the body:

```typescript
<body className="min-h-dvh bg-gradient-to-b from-background to-muted/30">
  <Analytics />
  {children}
</body>
```

- [ ] **Step 3: Verify**

Run: `pnpm build && pnpm start`
No errors. Visit the site, check browser network tab for `/va/vercel-analytics` script.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: add Vercel Analytics"
```

---

### Implementation Order

1. Task 1 (robots.txt)
2. Task 2 (sitemap.xml)
3. Task 3 (structured data + hreflang)
4. Task 4 (about page metadata)
5. Task 5 (stats page server wrapper)
6. Task 6 (custom 404)
7. Task 7 (article list page)
8. Task 8 (article detail pages + content)
9. Task 9 (social sharing enhancements)
10. Task 10 (Vercel Analytics)
