'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    if (!getSession()) {
      router.replace('/login')
      return
    }
    setAuthed(true)
    setReady(true)
  }, [router])

  if (!ready || !authed) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Verifying session…</span>
      </div>
    )
  }

  return <DashboardShell />
}
