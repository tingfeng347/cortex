import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUESTIONS_PER_TEST, QUESTION_TIME } from "@/lib/questions";
import { buildOgImageUrl } from "@/lib/metadata-utils";
import { AUTHOR_URL } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const ogUrl = buildOgImageUrl({ index: 50, tierKey: "moderateDecline", correct: "?" });

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
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

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
            <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Origin */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("originTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("originP1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("originP2")}</p>
          </section>

          {/* How it works */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("usageTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("usageP1", {
                count: QUESTIONS_PER_TEST,
                seconds: QUESTION_TIME,
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("usageP2")}</p>
          </section>

          {/* IRT Scoring */}
          <section id="irt-scoring" className="space-y-2 scroll-mt-20">
            <h2 className="text-sm font-semibold text-foreground">{t("irtTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("irtP1", {
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">{chunks}</strong>
                ),
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("irtP2", {
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">{chunks}</strong>
                ),
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("irtP3", {
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">{chunks}</strong>
                ),
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("irtP4", {
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">{chunks}</strong>
                ),
              })}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("irtP5", {
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">{chunks}</strong>
                ),
              })}
            </p>
          </section>

          {/* Data & Privacy */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("privacyTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("privacyP1")}</p>
          </section>

          {/* Disclaimer */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("disclaimerTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("disclaimerP1")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("disclaimerP2")}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("disclaimerP3")}</p>
          </section>

          {/* Open Source */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{t("ossTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.rich("ossP1", {
                officialSite: (chunks) => (
                  <a
                    href="https://cortex.hydroroll.team"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {chunks}
                  </a>
                ),
                github: (chunks) => (
                  <a
                    href="https://github.com/HsiangNianian/cortex"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </section>
        </div>

        {/* Signature */}
        <p className="mt-16 text-right text-xs text-muted-foreground">{t("signature")}</p>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline underline-offset-4">
            {t("footerBack")}
          </Link>
          {" · "}
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:underline underline-offset-4"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
