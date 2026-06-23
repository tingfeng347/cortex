"use client"

import { useState, useEffect } from "react"
import { useRouter, Link } from "@/i18n/navigation"
import { LogOut, Loader2, KeyRound } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ id: number; username: string; role: string } | null>(null)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [showPwdForm, setShowPwdForm] = useState(false)
  const [oldPwd, setOldPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdMsg, setPwdMsg] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/check").then((r) => r.json()),
      fetch("/api/admin/questions").then((r) => r.json()),
    ]).then(([auth, questions]) => {
      if (!auth.authenticated) {
        router.push("/admin/login")
        return
      }
      setAdmin(auth.admin)
      const qs = questions.questions || []
      setStats({
        pending: qs.filter((q: { status: string }) => q.status === "pending").length,
        approved: qs.filter((q: { status: string }) => q.status === "approved").length,
        rejected: qs.filter((q: { status: string }) => q.status === "rejected").length,
      })
      setLoading(false)
    }).catch(() => {
      router.push("/admin/login")
    })
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg("")
    if (!oldPwd || !newPwd) {
      setPwdMsg("请填写所有字段")
      return
    }
    if (newPwd.length < 6) {
      setPwdMsg("新密码至少需要 6 个字符")
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg("两次输入的新密码不一致")
      return
    }
    setPwdLoading(true)
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPwdMsg(data.error || "修改失败")
        return
      }
      setPwdMsg("密码修改成功 ✓")
      setOldPwd("")
      setNewPwd("")
      setConfirmPwd("")
      setShowPwdForm(false)
    } catch {
      setPwdMsg("网络错误")
    } finally {
      setPwdLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">管理后台</h1>
          <p className="text-sm text-muted-foreground">
            {admin?.username} ({admin?.role === "super_admin" ? "超级管理员" : "审题员"})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          退出
        </button>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Link
          href="/admin/questions?status=pending"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800/30 dark:bg-amber-950/30"
        >
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-sm text-amber-700 dark:text-amber-300">待审核</p>
        </Link>
        <Link
          href="/admin/questions?status=approved"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800/30 dark:bg-green-950/30"
        >
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-green-700 dark:text-green-300">已通过</p>
        </Link>
        <Link
          href="/admin/questions?status=rejected"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800/30 dark:bg-red-950/30"
        >
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-sm text-red-700 dark:text-red-300">已拒绝</p>
        </Link>
      </div>

      <div className="space-y-3">
        <Link
          href="/admin/questions"
          className="block rounded-lg border border-input p-4 transition-colors hover:bg-muted/50"
        >
          <p className="font-medium">审题</p>
          <p className="text-sm text-muted-foreground">查看所有提交的题目，进行审核</p>
        </Link>
        {admin?.role === "super_admin" && (
          <Link
            href="/admin/admins"
            className="block rounded-lg border border-input p-4 transition-colors hover:bg-muted/50"
          >
            <p className="font-medium">管理员管理</p>
            <p className="text-sm text-muted-foreground">创建或删除审题员账户</p>
          </Link>
        )}
        <button
          onClick={() => setShowPwdForm(!showPwdForm)}
          className="w-full rounded-lg border border-input p-4 text-left transition-colors hover:bg-muted/50"
        >
          <p className="font-medium">修改密码</p>
          <p className="text-sm text-muted-foreground">更改当前账户的登录密码</p>
        </button>
        <Link
          href="/"
          className="block rounded-lg border border-input p-4 transition-colors hover:bg-muted/50"
        >
          <p className="font-medium">返回首页</p>
          <p className="text-sm text-muted-foreground">回到认知防锈测试</p>
        </Link>
      </div>

      {showPwdForm && (
        <div className="mt-6 rounded-lg border border-input p-4">
          <h2 className="mb-3 text-sm font-medium">修改密码</h2>
          {pwdMsg && (
            <div className={`mb-3 rounded-md border px-3 py-2 text-xs ${
              pwdMsg.includes("✓")
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800/30 dark:bg-green-950/30 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800/30 dark:bg-red-950/30 dark:text-red-300"
            }`}>
              {pwdMsg}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              placeholder="当前密码"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="新密码"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="确认新密码"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={pwdLoading}
              className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              {pwdLoading ? "修改中..." : "确认修改"}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
