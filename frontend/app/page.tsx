<<<<<<< HEAD
import { DashboardShell } from '@/components/dashboard-shell'

export default function Page() {
=======
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard-shell'
import { getSession } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/login')
      return
    }
    setAuthed(true)
    setReady(true)
  }, [router])

  if (!ready || !authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

>>>>>>> origin/main
  return <DashboardShell />
}
