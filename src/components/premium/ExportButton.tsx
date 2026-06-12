"use client"

import { useState } from "react"
import { usePremium } from "./usePremium"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Check } from "lucide-react"

export function ExportButton() {
  const { isPremium, licenseKey } = usePremium()
  const [exporting, setExporting] = useState(false)
  const [done, setDone] = useState(false)

  if (!isPremium) return null

  async function handleExport() {
    if (!licenseKey || exporting) return
    setExporting(true)
    setDone(false)

    try {
      const res = await fetch("/api/premium/export", {
        headers: { Authorization: `Bearer ${licenseKey}` },
      })
      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "cognitive-rust-results.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch {
      // silent fail
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-1.5"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : done ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      导出 CSV
    </Button>
  )
}
