'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, BadgeCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DEMO_OFFICERS,
  getSession,
  setSession,
  type OfficerSession,
} from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [badge, setBadge] = useState('')
  const [officerId, setOfficerId] = useState('')
  const [selected, setSelected] = useState<OfficerSession | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getSession()) {
      router.replace('/dashboard')
    }
  }, [router])

  function loginAs(officer: OfficerSession) {
    setLoading(true)
    setSession(officer)
    router.replace('/dashboard')
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const byBadge = DEMO_OFFICERS.find(
      (o) => o.badgeNumber.toLowerCase() === badge.trim().toLowerCase(),
    )
    const byId = DEMO_OFFICERS.find((o) => o.officerId === officerId.trim())
    const match = selected || byBadge || byId
    if (!match) {
      setError(
        'Unknown officer. Use a demo badge (KA-1001, KA-1002, KA-2007, KA-3011) or pick a profile below.',
      )
      return
    }
    loginAs(match)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.35_0.06_235_/_0.25),_transparent_55%)]" />

      <div className="animate-fade-up relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <ShieldCheck className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Chain of Truth
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Evidence Integrity System · Sign in as an officer
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-xl">
          <p className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Identify acting officer
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="badge">
                Badge number
              </label>
              <input
                id="badge"
                value={badge}
                onChange={(e) => {
                  setBadge(e.target.value)
                  setSelected(null)
                }}
                placeholder="e.g. KA-1001"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground" htmlFor="oid">
                Or Officer ID
              </label>
              <input
                id="oid"
                value={officerId}
                onChange={(e) => {
                  setOfficerId(e.target.value)
                  setSelected(null)
                }}
                placeholder="e.g. 1"
                className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-ring/60 focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <Button type="submit" className="btn-press h-10 w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BadgeCheck className="size-4" />
              )}
              Continue to case workspace
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
              Quick demo profiles
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-2">
            {DEMO_OFFICERS.map((o, i) => (
              <button
                key={o.badgeNumber}
                type="button"
                onClick={() => loginAs(o)}
                className={cn(
                  'stagger-item hover-lift flex w-full items-center gap-3 rounded-xl border border-border bg-card/50 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5',
                  selected?.badgeNumber === o.badgeNumber && 'border-primary/50 bg-primary/10',
                )}
                style={{ ['--stagger-i' as string]: i }}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 font-mono text-xs font-semibold text-primary">
                  {o.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{o.fullName}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {o.badgeNumber} · {o.role}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
            Demo identity maps to <span className="font-mono">X-Officer-Id</span> /{' '}
            <span className="font-mono">X-Badge-Number</span> headers for the API.
            AI assists — humans decide.
          </p>
        </div>
      </div>
    </div>
  )
}
