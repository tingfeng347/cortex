import { NextResponse } from "next/server"
import { getCurrentAdmin } from "@/lib/community/auth"
import { getQuestionById, deleteQuestion, updateQuestion } from "@/lib/community/d1"

const QUESTION_TYPES = ["logic", "math", "vocab", "event", "event-cause", "event-argument"]

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    if (admin.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { id } = await params
    const questionId = parseInt(id, 10)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 })
    }

    const question = await getQuestionById(questionId)
    if (!question) {
      return NextResponse.json({ error: "not found" }, { status: 404 })
    }

    await deleteQuestion(questionId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/admin/questions/[id] error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    if (admin.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { id } = await params
    const questionId = parseInt(id, 10)
    if (isNaN(questionId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 })
    }

    const existing = await getQuestionById(questionId)
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 })
    }

    const body = await request.json()
    const data: {
      type?: string
      question?: string
      options?: string[]
      correct_answer?: number
      explanation?: string
    } = {}

    if (body.type !== undefined) {
      if (!QUESTION_TYPES.includes(body.type)) {
        return NextResponse.json({ error: "invalid type" }, { status: 400 })
      }
      data.type = body.type
    }
    if (body.question !== undefined) {
      if (typeof body.question !== "string" || body.question.trim().length < 2) {
        return NextResponse.json({ error: "question too short" }, { status: 400 })
      }
      data.question = body.question.trim()
    }
    if (body.options !== undefined) {
      if (!Array.isArray(body.options) || body.options.length < 2) {
        return NextResponse.json({ error: "need at least 2 options" }, { status: 400 })
      }
      data.options = body.options.map((o: string) => o.trim())
    }
    if (body.correct_answer !== undefined) {
      const ca = Number(body.correct_answer)
      if (!Number.isInteger(ca) || ca < 0) {
        return NextResponse.json({ error: "invalid correct_answer" }, { status: 400 })
      }
      data.correct_answer = ca
    }
    if (body.explanation !== undefined) {
      data.explanation = body.explanation
    }

    await updateQuestion(questionId, data)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PATCH /api/admin/questions/[id] error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
