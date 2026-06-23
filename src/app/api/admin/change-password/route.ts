import { NextResponse } from "next/server"
import { getCurrentAdmin, verifyPassword, hashPassword } from "@/lib/community/auth"
import { getAdminPasswordHash, updateAdmin } from "@/lib/community/d1"

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "旧密码和新密码不能为空" }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密码至少需要 6 个字符" }, { status: 400 })
    }

    const storedHash = await getAdminPasswordHash(admin.id)
    if (!storedHash) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    const valid = await verifyPassword(oldPassword, storedHash)
    if (!valid) {
      return NextResponse.json({ error: "旧密码不正确" }, { status: 403 })
    }

    const newHash = await hashPassword(newPassword)
    await updateAdmin(admin.id, { passwordHash: newHash })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("POST /api/admin/change-password error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
