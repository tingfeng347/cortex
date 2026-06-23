"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import { Link } from "@/i18n/navigation"

const QUESTION_TYPES = ["logic", "math", "vocab", "event", "event-cause", "event-argument"] as const

export default function SubmitQuestionPage() {
  const t = useTranslations("submitQuestion")
  const tc = useTranslations("question")
  const tc2 = useTranslations("submitConfirm")

  const [type, setType] = useState<string>("logic")
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>(["", ""])
  const [correctAnswer, setCorrectAnswer] = useState<number>(0)
  const [explanation, setExplanation] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options]
    next[index] = value
    setOptions(next)
  }

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    const next = options.filter((_, i) => i !== index)
    setOptions(next)
    if (correctAnswer >= next.length) setCorrectAnswer(next.length - 1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Client-side validation
    if (!type || !QUESTION_TYPES.includes(type as typeof QUESTION_TYPES[number])) {
      setError(t("errorType"))
      return
    }
    if (!question.trim() || question.trim().length < 2) {
      setError(t("errorQuestion"))
      return
    }
    const validOptions = options.filter((o) => o.trim())
    if (validOptions.length < 2) {
      setError(t("errorOptions"))
      return
    }
    if (correctAnswer < 0 || correctAnswer >= options.length || !options[correctAnswer]?.trim()) {
      setError(t("errorAnswer"))
      return
    }
    const emailRe = /^[a-zA-Z0-9._%+-]+@(qq\.com|gmail\.com)$/
    if (!emailRe.test(email.trim())) {
      setError(t("errorEmail"))
      return
    }

    // Show confirmation dialog
    setShowConfirm(true)
  }

  const confirmSubmit = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          question: question.trim(),
          options: options.filter((o) => o.trim()),
          correctAnswer,
          explanation: explanation.trim(),
          submitterEmail: email.trim(),
          submitterName: name.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.details?.join("；") || data.error || t("errorType"))
        return
      }
      setSuccess(true)
      formRef.current?.reset()
      setType("logic")
      setQuestion("")
      setOptions(["", ""])
      setCorrectAnswer(0)
      setExplanation("")
      setEmail("")
      setName("")
    } catch {
      setError(t("errorNetwork"))
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel = (type: string) => {
    const key = `category.${type}`
    const label = tc(key)
    return label !== key ? label : type
  }

  const questionHint = t(`questionHint_${type}` as any) || t("questionLabel")

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-800/30 dark:bg-green-950/30">
          <p className="text-lg font-medium text-green-800 dark:text-green-200">{t("success")}</p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setSuccess(false)}
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              {t("submitAnother")}
            </button>
            <Link
              href="/"
              className="rounded-md border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("backToHome")}
      </Link>

      <h1 className="mb-2 text-xl font-bold">{t("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("subtitle")}</p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/30 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Type */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("typeLabel")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {QUESTION_TYPES.map((qt) => (
              <option key={qt} value={qt}>{typeLabel(qt)}</option>
            ))}
          </select>
        </div>

        {/* Question */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("questionLabel")}</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={questionHint}
          />
        </div>

        {/* Options */}
        <div>
          <label className="mb-1 block text-sm font-medium">{t("optionsLabel")}</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswer === i}
                  onChange={() => setCorrectAnswer(i)}
                  className="shrink-0"
                  title={t("markCorrect")}
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={`${t("optionsLabel")} ${i + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="shrink-0 text-sm text-red-500 hover:text-red-700"
                  >
                    {t("removeOption")}
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-blue-500 hover:text-blue-700"
            >
              {t("addOption")}
            </button>
          )}
        </div>

        {/* Explanation */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("explanationLabel")} <span className="text-muted-foreground">（{t("explanationHint")}）</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("explanationPlaceholder")}
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("emailLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="yourname@qq.com"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("emailHint")}</p>
        </div>

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("nameLabel")} <span className="text-muted-foreground">（{t("nameHint")}）</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t("nameLabel")}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submit")}
        </button>
      </form>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{tc2("title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{tc2("intro")}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-foreground/40">•</span>
                <span>{tc2("original")}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-foreground/40">•</span>
                <span>{tc2("compliant")}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-foreground/40">•</span>
                <span>{tc2("name")}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-foreground/40">•</span>
                <span>{tc2("review")}</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-foreground/40">•</span>
                <span>{tc2("quota")}</span>
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? t("submitting") : tc2("confirm")}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 rounded-md border border-input px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {tc2("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
