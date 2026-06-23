"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/i18n/navigation"
import { ArrowLeft, Loader2, Trash2, Pencil } from "lucide-react"
import { Link } from "@/i18n/navigation"

interface AdminUser {
  id: number
  username: string
  role: string
  nickname: string | null
  created_at: string
}

export default function AdminAdminsPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ id: number; username: string; role: string; nickname: string | null } | null>(null)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("reviewer")
  const [newNickname, setNewNickname] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPassword, setEditPassword] = useState("")
  const [editRole, setEditRole] = useState("reviewer")
  const [editNickname, setEditNickname] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchAdmins = async () => {
    const res = await fetch("/api/admin/admins")
    const data = await res.json()
    if (data.admins) setAdmins(data.admins)
  }

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((auth) => {
        if (!auth.authenticated || auth.admin.role !== "super_admin") {
          router.push("/admin/login")
          return
        }
        setAdmin(auth.admin)
        return fetchAdmins()
      })
      .then(() => setLoading(false))
      .catch(() => router.push("/admin/login"))
  }, [router])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!newUsername.trim() || !newPassword.trim()) {
      setError("用户名和密码不能为空")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          role: newRole,
          nickname: newNickname.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error === "username already exists" || data.error === "username or nickname already exists" ? "用户名或昵称已存在" : data.error || "创建失败")
        return
      }
      setNewUsername("")
      setNewPassword("")
      setNewNickname("")
      setNewRole("reviewer")
      await fetchAdmins()
    } catch {
      setError("网络错误")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number, username: string) => {
    if (!confirm(`确定删除管理员「${username}」？此操作不可撤销。`)) return
    const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" })
    if (res.ok) await fetchAdmins()
  }

  const handleEdit = async (id: number) => {
    setSaving(true)
    setError("")
    try {
      const body: { password?: string; role?: string; nickname?: string | null } = {}
      if (editPassword.trim()) body.password = editPassword.trim()
      if (editRole) body.role = editRole
      body.nickname = editNickname.trim() || null
      const res = await fetch(`/api/admin/admins/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "保存失败")
        return
      }
      setEditingId(null)
      setEditPassword("")
      await fetchAdmins()
    } catch {
      setError("网络错误")
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = (role: string) => role === "super_admin" ? "超级管理员" : "审题员"

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        返回后台
      </Link>
      <h1 className="mt-2 text-xl font-bold">管理员管理</h1>

      {/* Create form */}
      <div className="mt-6 rounded-lg border border-input p-4">
        <h2 className="mb-3 text-sm font-medium">创建新的审题员</h2>
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800/30 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="用户名"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:flex-1"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="密码"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:flex-1"
            />
            <input
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="昵称（可选）"
              className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-36"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-auto"
            >
              <option value="reviewer">审题员</option>
              <option value="super_admin">超级管理员</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {creating ? "创建中..." : "创建"}
          </button>
        </form>
      </div>

      {/* Admin list */}
      <div className="mt-6 space-y-2">
        {admins.map((a) => {
          const isEditing = editingId === a.id
          return (
            <div key={a.id} className="rounded-lg border border-input">
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">
                    {a.username}
                    {a.nickname && <span className="ml-1.5 text-xs text-muted-foreground">({a.nickname})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabel(a.role)} · 创建于 {a.created_at?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {admin?.id !== a.id && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(isEditing ? null : a.id)
                          setEditPassword("")
                          setEditRole(a.role)
                          setEditNickname(a.nickname ?? "")
                          setError("")
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id, a.username)}
                        className="text-sm text-red-500 hover:text-red-700"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="border-t border-input px-3 pb-3 pt-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      placeholder="昵称（留空则显示用户名）"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-36"
                    />
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="新密码（留空不修改）"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:flex-1"
                    />
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="reviewer">审题员</option>
                      <option value="super_admin">超级管理员</option>
                    </select>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(a.id)}
                      disabled={saving}
                      className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "保存中..." : "保存"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md border border-input px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
