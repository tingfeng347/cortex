"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"
import { Link } from "@/i18n/navigation"

interface QuestionDetail {
  id: number
  type: string
  question: string
  options: string
  correct_answer: number
  explanation: string
  submitter_email: string
  submitter_name: string
  status: string
  admin_notes: string
  created_at: string
}

export default function AdminQuestionReviewPage() {
  const router = useRouter()
  const params = useParams()
  const [admin, setAdmin] = useState<{ id: number; username: string; role: string } | null>(null)
  const [question, setQuestion] = useState<QuestionDetail | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [adminNotes, setAdminNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [editing, setEditing] = useState(false)
  const [editType, setEditType] = useState("")
  const [editQuestion, setEditQuestion] = useState("")
  const [editOptions, setEditOptions] = useState<string[]>([])
  const [editCorrectAnswer, setEditCorrectAnswer] = useState(0)
  const [editExplanation, setEditExplanation] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/check").then((r) => r.json()),
      fetch(`/api/admin/questions`).then((r) => r.json()),
    ]).then(([auth, data]) => {
      if (!auth.authenticated) {
        router.push("/admin/login")
        return
      }
      setAdmin(auth.admin)
      const id = Number(params?.id)
      const q = (data.questions || []).find((q: QuestionDetail) => q.id === id)
      if (q) {
        setQuestion(q)
        try { setOptions(JSON.parse(q.options)) } catch { setOptions([]) }
        setAdminNotes(q.admin_notes || "")
      }
      setLoading(false)
    }).catch(() => router.push("/admin/login"))
  }, [router, params])

  const handleReview = async (status: "approved" | "rejected") => {
    setActionLoading(true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/questions/${question?.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || "操作失败")
        return
      }
      setMessage(status === "approved" ? "已通过审核 ✓" : "已拒绝 ✗")
      if (question) setQuestion({ ...question, status })
    } catch {
      setMessage("网络错误")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("确定删除这道题？此操作不可撤销。")) return
    setActionLoading(true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/questions/${question?.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setMessage(data.error || "删除失败")
        return
      }
      router.push("/admin/questions")
    } catch {
      setMessage("网络错误")
    } finally {
      setActionLoading(false)
    }
  }

  const startEditing = () => {
    if (!question) return
    setEditType(question.type)
    setEditQuestion(question.question)
    setEditOptions([...options])
    setEditCorrectAnswer(question.correct_answer)
    setEditExplanation(question.explanation || "")
    setEditing(true)
    setMessage("")
  }

  const cancelEditing = () => {
    setEditing(false)
    setMessage("")
  }

  const handleEditSave = async () => {
    if (!question) return
    if (!editQuestion.trim() || editQuestion.trim().length < 2) {
      setMessage("题干至少需要 2 个字符")
      return
    }
    const validOptions = editOptions.filter((o) => o.trim())
    if (validOptions.length < 2) {
      setMessage("至少需要 2 个选项")
      return
    }
    if (editCorrectAnswer < 0 || editCorrectAnswer >= editOptions.length || !editOptions[editCorrectAnswer]?.trim()) {
      setMessage("请选择正确的答案")
      return
    }

    setActionLoading(true)
    setMessage("")
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editType,
          question: editQuestion.trim(),
          options: validOptions,
          correct_answer: editCorrectAnswer,
          explanation: editExplanation.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMessage(data.error || "保存失败")
        return
      }
      // Update local state
      setQuestion({
        ...question,
        type: editType,
        question: editQuestion.trim(),
        options: JSON.stringify(validOptions),
        correct_answer: editCorrectAnswer,
        explanation: editExplanation.trim(),
      })
      setOptions(validOptions)
      setEditing(false)
      setMessage("已保存 ✓")
    } catch {
      setMessage("网络错误")
    } finally {
      setActionLoading(false)
    }
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      logic: "逻辑推理",
      math: "速算",
      vocab: "词汇语义",
      event: "事件排序",
      "event-cause": "因果推断",
      "event-argument": "论证分析",
    }
    return map[type] || type
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-muted-foreground">题目不存在</p>
        <Link href="/admin/questions" className="mt-4 inline-block text-sm text-blue-500 hover:text-blue-700">
          返回审题列表
        </Link>
      </div>
    )
  }

  const answerLabels = options.map((_, i) => String.fromCharCode(65 + i))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/questions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Link>

      <h1 className="mt-4 text-xl font-bold">
        审核题目 #{question.id}
        {admin?.role === "super_admin" && !editing && (
          <button
            onClick={startEditing}
            className="ml-2 inline-flex items-center gap-1 text-sm font-normal text-muted-foreground hover:text-foreground"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
            编辑
          </button>
        )}
      </h1>

      <div className="mt-6 space-y-4">
        {/* Type */}
        <div>
          <p className="text-xs text-muted-foreground">题型</p>
          {editing ? (
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {["logic", "math", "vocab", "event", "event-cause", "event-argument"].map((t) => (
                <option key={t} value={t}>{typeLabel(t)}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm font-medium">{typeLabel(question.type)}</p>
          )}
        </div>

        {/* Question */}
        <div>
          <p className="text-xs text-muted-foreground">题干</p>
          {editing ? (
            <textarea
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          ) : (
            <div className="mt-1 whitespace-pre-wrap rounded-md border border-input bg-muted/30 p-3 text-sm">
              {question.question}
            </div>
          )}
        </div>

        {/* Options */}
        <div>
          <p className="text-xs text-muted-foreground">选项</p>
          {editing ? (
            <div className="mt-1 space-y-2">
              {editOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="editCorrect"
                    checked={editCorrectAnswer === i}
                    onChange={() => setEditCorrectAnswer(i)}
                    className="shrink-0"
                    title="标记为正确答案"
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...editOptions]
                      next[i] = e.target.value
                      setEditOptions(next)
                    }}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder={`选项 ${i + 1}`}
                  />
                  {editOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = editOptions.filter((_, j) => j !== i)
                        setEditOptions(next)
                        if (editCorrectAnswer >= next.length) setEditCorrectAnswer(next.length - 1)
                      }}
                      className="shrink-0 text-sm text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
              {editOptions.length < 6 && (
                <button
                  type="button"
                  onClick={() => setEditOptions([...editOptions, ""])}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  + 添加选项
                </button>
              )}
              {editCorrectAnswer >= 0 && editCorrectAnswer < editOptions.length && (
                <p className="text-xs text-green-600">
                  ✓ 当前正确答案：{String.fromCharCode(65 + editCorrectAnswer)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-1 space-y-1.5">
              {options.map((opt, i) => (
                <div
                  key={i}
                  className={`rounded-md border p-2.5 text-sm ${
                    i === question.correct_answer
                      ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20"
                      : "border-input"
                  }`}
                >
                  <span className="mr-2 font-medium">{answerLabels[i]}.</span>
                  {opt}
                  {i === question.correct_answer && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">✓ 正确答案</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div>
          <p className="text-xs text-muted-foreground">解析</p>
          {editing ? (
            <textarea
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="解析（可选）"
            />
          ) : question.explanation ? (
            <p className="mt-1 whitespace-pre-wrap text-sm">{question.explanation}</p>
          ) : null}
        </div>

        <div className="rounded-md border border-input bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">出题人</p>
          <p className="text-sm">{question.submitter_name || "匿名"}</p>
          <p className="text-xs text-muted-foreground mt-1">邮箱</p>
          <p className="text-sm">{question.submitter_email}</p>
          <p className="text-xs text-muted-foreground mt-1">提交时间</p>
          <p className="text-sm">{question.created_at}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">审核备注</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="审核意见（可选）"
          />
        </div>

        {message && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800/30 dark:bg-blue-950/30 dark:text-blue-300">
            {message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleReview("approved")}
            disabled={actionLoading}
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {actionLoading ? "处理中..." : "通过"}
          </button>
          <button
            onClick={() => handleReview("rejected")}
            disabled={actionLoading}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {actionLoading ? "处理中..." : "拒绝"}
          </button>
        </div>

        {admin?.role === "super_admin" && !editing && (
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="w-full rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            {actionLoading ? "处理中..." : "删除题目"}
          </button>
        )}

        {editing && (
          <div className="flex gap-3">
            <button
              onClick={handleEditSave}
              disabled={actionLoading}
              className="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading ? "保存中..." : "保存修改"}
            </button>
            <button
              onClick={cancelEditing}
              disabled={actionLoading}
              className="flex-1 rounded-md border border-input px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
