"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, Loader2, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react"
import { Link } from "@/i18n/navigation"

interface MarketplaceQuestion {
  id: number
  type: string
  question: string
  options: string
  correct_answer: number
  explanation: string
  submitter_email: string
  submitter_name: string
  status: "pending" | "approved" | "rejected"
  admin_notes: string
  reviewer_name: string | null
  reviewed_at: string | null
  created_at: string
  upvotes: number
  downvotes: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/30",
  approved: "text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-950/30",
  rejected: "text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/30",
}

export default function CommunityMarketplacePage() {
  const t = useTranslations("marketplace")
  const tc = useTranslations("question")

  const [questions, setQuestions] = useState<MarketplaceQuestion[]>([])
  const [myVotes, setMyVotes] = useState<Record<number, number | undefined>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [votingIds, setVotingIds] = useState<Set<number>>(new Set)
  const [statusFilter, setStatusFilter] = useState<string>("")

  useEffect(() => {
    setLoading(true)
    setError("")
    Promise.all([
      fetch("/api/community/marketplace").then((r) => r.json()),
      fetch("/api/community/my-votes").then((r) => r.json()),
    ])
      .then(([marketplaceData, votesData]) => {
        if (marketplaceData.error) {
          setError(t("error"))
          return
        }
        if (marketplaceData.questions) setQuestions(marketplaceData.questions)
        if (votesData.votes) {
          const map: Record<number, number> = {}
          votesData.votes.forEach((v: { question_id: number; vote: number }) => {
            map[v.question_id] = v.vote
          })
          setMyVotes(map)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(t("error"))
        setLoading(false)
      })
  }, [t])

  const handleVote = async (questionId: number, vote: 1 | -1) => {
    setVotingIds((prev) => {
      const next = new Set(prev)
      next.add(questionId)
      return next
    })

    const prevVote = myVotes[questionId]

    // Optimistic update
    setMyVotes((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === vote ? undefined : vote,
    }))

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q
        let up = q.upvotes
        let down = q.downvotes

        // Remove previous vote effect
        if (prevVote === 1) up = Math.max(0, up - 1)
        if (prevVote === -1) down = Math.max(0, down - 1)

        if (prevVote === vote) {
          // Toggle off — restore counts
          return { ...q, upvotes: q.upvotes, downvotes: q.downvotes }
        }

        // Add new vote
        if (vote === 1) up++
        if (vote === -1) down++

        return { ...q, upvotes: up, downvotes: down }
      })
    )

    try {
      const res = await fetch("/api/community/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, vote }),
      })
      if (!res.ok) {
        // Revert on error
        setMyVotes((prev) => ({ ...prev, [questionId]: prevVote }))
        const data = await fetch("/api/community/marketplace").then((r) => r.json())
        if (data.questions) setQuestions(data.questions)
      }
    } catch {
      setMyVotes((prev) => ({ ...prev, [questionId]: prevVote }))
      const data = await fetch("/api/community/marketplace").then((r) => r.json())
      if (data.questions) setQuestions(data.questions)
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  const typeLabel = (type: string) => {
    const key = `category.${type}`
    const label = tc(key)
    return label !== key ? label : type
  }

  const filteredQuestions =
    statusFilter === ""
      ? questions
      : questions.filter((q) => q.status === statusFilter)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToHome")}
      </Link>

      <h1 className="mb-1 text-xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("subtitle")}</p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {["", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              statusFilter === s
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s ? STATUS_LABELS[s] || s : t("all")}
          </button>
        ))}
      </div>

      {filteredQuestions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((q) => {
            const isExpanded = expandedId === q.id
            const myVote = myVotes[q.id]
            const isVoting = votingIds.has(q.id)

            return (
              <div
                key={q.id}
                className="rounded-lg border border-input transition-colors"
              >
                {/* Card header */}
                <div className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        STATUS_COLORS[q.status] || ""
                      }`}
                    >
                      {STATUS_LABELS[q.status] || q.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {typeLabel(q.type)}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {q.created_at?.slice(0, 10)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm">{q.question}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("submitter")}：{q.submitter_name || t("anonymous")}
                  </p>

                  {/* Vote + expand row */}
                  <div className="mt-3 flex items-center gap-3">
                    {/* Upvote */}
                    <button
                      onClick={() => handleVote(q.id, 1)}
                      disabled={isVoting}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                        myVote === 1
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      } disabled:opacity-50`}
                      title={t("upvote")}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{q.upvotes}</span>
                    </button>

                    {/* Downvote */}
                    <button
                      onClick={() => handleVote(q.id, -1)}
                      disabled={isVoting}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors ${
                        myVote === -1
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      } disabled:opacity-50`}
                      title={t("downvote")}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>{q.downvotes}</span>
                    </button>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? t("collapseDetail") : t("expandDetail")}
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-input px-4 pb-4 pt-3 space-y-3">
                    {/* Options */}
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        {t("options")}
                      </p>
                      <div className="space-y-1">
                        {(JSON.parse(q.options) as string[]).map(
                          (opt: string, i: number) => (
                            <div
                              key={i}
                              className={`rounded-md border p-2 text-sm ${
                                i === q.correct_answer
                                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20"
                                  : "border-input"
                              }`}
                            >
                              <span className="mr-2 font-medium">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                              {i === q.correct_answer && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  ✓ {t("answer")}
                                </span>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          {t("explanation")}
                        </p>
                        <p className="whitespace-pre-wrap rounded-md border border-input bg-muted/30 p-2.5 text-sm">
                          {q.explanation}
                        </p>
                      </div>
                    )}

                    {/* Admin review info */}
                    {q.status !== "pending" && (
                      <div className="rounded-md border border-input bg-muted/30 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("reviewInfo")}
                        </p>
                        {q.reviewer_name && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("reviewedBy", { name: q.reviewer_name })}
                          </p>
                        )}
                        {q.reviewed_at && (
                          <p className="text-xs text-muted-foreground">
                            {t("reviewedAt", {
                              date: q.reviewed_at.slice(0, 10),
                            })}
                          </p>
                        )}
                        {q.admin_notes && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("adminNotes", { notes: q.admin_notes })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
