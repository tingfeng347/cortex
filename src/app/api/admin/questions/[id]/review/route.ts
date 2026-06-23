import { NextResponse } from "next/server"
import { getCurrentAdmin } from "@/lib/community/auth"
import { getQuestionById, reviewQuestion } from "@/lib/community/d1"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
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

    // Only super_admin can re-review a question that's already been reviewed
    if (question.status !== "pending" && admin.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden: question already reviewed" }, { status: 403 })
    }

    const { status, adminNotes } = await request.json()
    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "status must be 'approved' or 'rejected'" }, { status: 400 })
    }

    await reviewQuestion(questionId, status, admin.id, (adminNotes || "").trim())

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/admin/questions/review error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
