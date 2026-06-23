import { NextResponse } from "next/server"
import { getCurrentAdmin } from "@/lib/community/auth"
import { getAdminByNickname, getAdminByUsernameOrNickname, updateAdmin } from "@/lib/community/d1"

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const { nickname } = await request.json()

    // Allow null/empty to clear nickname
    const finalNickname =
      nickname === null || nickname === undefined || nickname === ""
        ? null
        : String(nickname).trim()

    if (finalNickname !== null) {
      // Check uniqueness: no other admin has this nickname or username
      const existing = await getAdminByUsernameOrNickname(finalNickname)
      if (existing && existing.id !== admin.id) {
        return NextResponse.json({ error: "nickname already exists" }, { status: 409 })
      }
    }

    await updateAdmin(admin.id, { nickname: finalNickname })
    return NextResponse.json({ ok: true, nickname: finalNickname })
  } catch (err) {
    console.error("PATCH /api/admin/profile error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
