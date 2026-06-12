"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, Heart, Star, Coffee, Loader2 } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface SponsorUser {
  userId: string
  name: string
  avatar: string
}

interface SponsorEntry {
  user: SponsorUser
  allSumAmount: string
  planName: string
  planPrice: string
  lastPayTime: number
  planId: string
  anonymous?: boolean
}

interface SponsorsData {
  sponsors: SponsorEntry[]
  supportWall: SponsorEntry[]
  sponsorWall: SponsorEntry[]
  total: number
  cached: boolean
}

function SponsorCard({ entry }: { entry: SponsorEntry }) {
  const price = parseFloat(entry.planPrice)
  const isPremium = price >= 20
  const anon = entry.anonymous === true

  return (
    <div className={`flex items-center gap-3 rounded-xl p-4 ${isPremium ? "border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950" : "border bg-card"}`}>
      {entry.user.avatar && !anon ? (
        <img
          src={entry.user.avatar}
          alt={entry.user.name}
          className="h-10 w-10 rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${anon ? "blur-[2px]" : ""}`}>
          {anon ? (
            <Coffee className="h-5 w-5 text-muted-foreground/50" />
          ) : (
            <Coffee className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${anon ? "blur-[3px] select-none" : ""}`}>
          {anon ? "匿名用户" : entry.user.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.planName || "Sponsor"}
          {entry.planPrice && ` · ¥${entry.planPrice}`}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
          ¥{entry.allSumAmount}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPremium ? <Star className="inline h-3 w-3 text-amber-500" /> : <Heart className="inline h-3 w-3 text-red-400" />}
        </p>
      </div>
    </div>
  )
}

export default function SponsorsPage() {
  const t = useTranslations("sponsors")
  const [data, setData] = useState<SponsorsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/api/sponsors")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  return (
    <div className="flex min-h-dvh flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("backToTest")}
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {data.sponsorWall && data.sponsorWall.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    {t("sponsorList")}
                  </CardTitle>
                  <CardDescription>{t("sponsorListDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.sponsorWall.map((s, i) => (
                    <SponsorCard key={i} entry={s} />
                  ))}
                </CardContent>
              </Card>
            )}

            {data.supportWall && data.supportWall.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coffee className="h-5 w-5 text-amber-600" />
                    {t("supportList")}
                  </CardTitle>
                  <CardDescription>{t("supportListDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.supportWall.map((s, i) => (
                    <SponsorCard key={i} entry={s} />
                  ))}
                </CardContent>
              </Card>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {t("totalCount", { count: data.total })} · {t("cacheNote")}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
