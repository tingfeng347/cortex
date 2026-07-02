import { type Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AutoRedirect } from "@/components/share-redirect";
import { getTierByIndex, getChallengeCopy } from "@/lib/scoring";
import { buildOgImageUrl, buildShareMetadataText } from "@/lib/metadata-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const index = 50;
  const tier = getTierByIndex(index);
  const challengeCopy = getChallengeCopy(tier.tierKey, index);
  const t = await getTranslations({ locale, namespace: "site" });
  const tierT = await getTranslations({ locale, namespace: "tier" });
  const { title, description } = buildShareMetadataText({
    siteTitle: t("title"),
    tierKey: tier.tierKey,
    tierLabel: tierT(tier.tierKey),
    index,
  });

  const ogUrl = buildOgImageUrl({
    index,
    tierKey: tier.tierKey,
    correct: "?",
    challenge: challengeCopy,
  });

  return {
    title: t("title") + " · " + t("subtitle"),
    description: t("description", { count: 20 }),
    openGraph: {
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: 20 }),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title") + " · " + t("subtitle"),
      description: t("description", { count: 20 }),
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AutoRedirect />;
}
