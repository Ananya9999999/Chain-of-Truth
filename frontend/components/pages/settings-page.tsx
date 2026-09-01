'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { caseMeta } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { UserCheck, ShieldCheck, KeyRound, Bell, Fingerprint } from 'lucide-react'

const securityItems = [
  {
    icon: Fingerprint,
    label: 'Two-factor authentication',
    detail: 'Hardware key · enrolled',
    ok: true,
  },
  {
    icon: KeyRound,
    label: 'Session encryption',
    detail: 'AES-256 · active',
    ok: true,
  },
  {
    icon: ShieldCheck,
    label: 'Evidence signing certificate',
    detail: 'Valid through Mar 2027',
    ok: true,
  },
]

const preferences = [
  {
    label: 'Show AI hypotheses inline',
    detail: 'Display unverified AI findings alongside the verified record.',
    default: true,
  },
  {
    label: 'Require two-person confirmation',
    detail: 'Evidence cannot be marked verified by a single officer.',
    default: true,
  },
  {
    label: 'Contradiction alerts',
    detail: 'Notify me when the analysis layer detects a conflict.',
    default: true,
  },
  {
    label: 'Nightly hash integrity check',
    detail: 'Recompute all evidence hashes and report mismatches.',
    default: true,
  },
]

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-secondary',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-background transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function SettingsPage() {
  const [prefs, setPrefs] = useState(preferences.map((p) => p.default))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your investigator profile, review your security posture, and configure how the evidence-integrity system behaves."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Current user</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/15 font-mono text-base font-semibold text-primary">
                AM
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {caseMeta.officer}
                </p>
                <p className="text-xs text-muted-foreground">{caseMeta.role}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Badge ID</span>
                <span className="font-mono text-foreground">DET-4471</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Clearance</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-success">
                  <UserCheck className="size-3.5" />
                  Level 3 · Case lead
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned case</span>
                <span className="font-mono text-foreground">#{caseMeta.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" />
              <CardTitle>Security status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <ShieldCheck className="size-3" />
                  Secure
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <CardTitle>System preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {preferences.map((pref, i) => (
            <div
              key={pref.label}
              className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-secondary/40"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {pref.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pref.detail}
                </p>
              </div>
              <Toggle
                on={prefs[i]}
                onChange={() =>
                  setPrefs((prev) =>
                    prev.map((v, idx) => (idx === i ? !v : v)),
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
