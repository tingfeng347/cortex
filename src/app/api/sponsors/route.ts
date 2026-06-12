import { NextResponse } from "next/server"
import { querySponsors, type SponsorEntry } from "@/lib/payment/afdian"
import anonymousRaw from "@/data/sponsor-anonymous.json"

const anonymousSet = new Set(anonymousRaw.anonymous as string[])

function isAnonymous(userId: string): boolean {
  return anonymousSet.has(userId)
}

type SponsorEntryWithAnon = SponsorEntry & { anonymous: boolean }

// Cache for 5 minutes
let cache: { entries: SponsorEntry[]; total: number; timestamp: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function GET() {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      const withAnon: SponsorEntryWithAnon[] = cache.entries.map((s) => ({
        ...s,
        anonymous: isAnonymous(s.user.userId),
      }))
      const supportWall = withAnon.filter((s) => parseFloat(s.planPrice) < 20)
      const sponsorWall = withAnon.filter((s) => parseFloat(s.planPrice) >= 20)
      return NextResponse.json({
        sponsors: withAnon,
        supportWall,
        sponsorWall,
        total: cache.total,
        cached: true,
      }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      })
    }

    const allSponsors: SponsorEntry[] = []
    let page = 1
    let totalPages = 1

    // Fetch all pages
    while (page <= totalPages && page <= 10) {
      const result = await querySponsors(page, 100)
      if (!result || result.entries.length === 0) break
      allSponsors.push(...result.entries)
      totalPages = result.totalPage
      page++
    }

    // Tag anonymous users
    const withAnon: SponsorEntryWithAnon[] = allSponsors.map((s) => ({
      ...s,
      anonymous: isAnonymous(s.user.userId),
    }))

    // Separate by tier
    const supportWall = withAnon.filter((s) => {
      const price = parseFloat(s.planPrice)
      return price < 20
    })
    const sponsorWall = withAnon.filter((s) => {
      const price = parseFloat(s.planPrice)
      return price >= 20
    })

    cache = { entries: allSponsors, total: allSponsors.length, timestamp: Date.now() }

    return NextResponse.json({
      sponsors: withAnon,
      supportWall,
      sponsorWall,
      total: allSponsors.length,
      cached: false,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("[sponsors] Error:", error)
    return NextResponse.json({ sponsors: [], supportWall: [], sponsorWall: [], total: 0 }, { status: 500 })
  }
}
