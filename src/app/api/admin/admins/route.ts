import { NextResponse } from "next/server"
import { getCurrentAdmin, hashPassword } from "@/lib/community/auth"
import { getAllAdmins, createAdmin } from "@/lib/community/d1"

export async function GET() {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    if (admin.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const admins = await getAllAdmins()
    return NextResponse.json({ admins })
  } catch (err) {
    console.error("GET /api/admin/admins error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
    if (admin.role !== "super_admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { username, password, role, nickname } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 })
    }
    const finalRole = role === "super_admin" ? "super_admin" : "reviewer"
    const finalNickname =
      nickname && typeof nickname === "string"
        ? nickname.trim() || undefined
        : undefined

    const passwordHash = await hashPassword(password)
    await createAdmin(username, passwordHash, finalRole, finalNickname)

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err && typeof err === "object" && "message" in err) {
      const msg = String(err.message)
      if (msg.includes("UNIQUE constraint")) {
        return NextResponse.json({ error: "username or nickname already exists" }, { status: 409 })
      }
    }
    console.error("POST /api/admin/admins error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
