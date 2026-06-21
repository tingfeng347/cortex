import { NextResponse } from "next/server"
import { getCurrentAdmin, hashPassword } from "@/lib/community/auth"
import { deleteAdmin, updateAdmin } from "@/lib/community/d1"

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
    const adminId = parseInt(id, 10)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 })
    }

    const body = await request.json()
    const updates: { passwordHash?: string; role?: string } = {}

    if (body.password) {
      updates.passwordHash = await hashPassword(body.password)
    }
    if (body.role && (body.role === "super_admin" || body.role === "reviewer")) {
      updates.role = body.role
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 })
    }

    await updateAdmin(adminId, updates)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("PATCH /api/admin/admins error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}

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
    const adminId = parseInt(id, 10)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "invalid id" }, { status: 400 })
    }

    // Prevent self-deletion
    if (adminId === admin.id) {
      return NextResponse.json({ error: "cannot delete yourself" }, { status: 400 })
    }

    await deleteAdmin(adminId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("DELETE /api/admin/admins error:", err)
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }
}
