'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { caseMeta } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { UserCheck, ShieldCheck, KeyRound, Bell, Fingerprint, Lock, Shield } from 'lucide-react'

const securityItems = [
  {
    icon: Fingerprint,
    label: 'Hardware 2FA Authentication',
    detail: 'YubiKey FIPS · Enrolled & Verified',
    ok: true,
  },
  {
    icon: KeyRound,
    label: 'Session Cipher Suite',
    detail: 'TLS 1.3 · AES-256-GCM Ephemeral',
    ok: true,
  },
  {
    icon: ShieldCheck,
    label: 'Evidence Signing Certificate',
    detail: 'ECDSA P-384 · Valid through Mar 2027',
    ok: true,
  },
]

const preferences = [
  {
    label: 'Show AI working hypotheses inline',
    detail: 'Display unverified machine inferences alongside the verified court record.',
    default: true,
  },
  {
    label: 'Mandate two-officer cryptographic sign-off',
    detail: 'Prevent evidence artifacts from reaching verified status without secondary credential confirmation.',
    default: true,
  },
  {
    label: 'Real-time temporal contradiction alerts',
    detail: 'Trigger priority notification banners upon detection of witness-CCTV timestamp discrepancies.',
    default: true,
  },
  {
    label: 'Nightly automated SHA-256 integrity scan',
    detail: 'Autonomously recalculate all vault digests and report checksum discrepancies.',
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
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 cursor-pointer border',
        on
          ? 'bg-primary border-primary/60'
          : 'bg-secondary border-border/80',
      )}
    >
      <span
        className={cn(
          'inline-block size-3.5 rounded-full bg-background transition-transform duration-150 shadow-xs',
          on ? 'translate-x-4.5' : 'translate-x-0.5',
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
        title="Security Posture & System Preferences"
        description="Review cryptographic credentials, investigator clearance certificates, and algorithmic separation policies."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* User Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b border-border/60 pb-3.5">
            <CardTitle>Investigator Identity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 font-mono text-sm font-bold text-primary shadow-xs">
                AM
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {caseMeta.officer}
                </p>
                <p className="font-mono text-[10.5px] text-muted-foreground uppercase">{caseMeta.role}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-border/60 pt-3.5 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Badge ID</span>
                <span className="font-semibold text-foreground">DET-4471</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Clearance</span>
                <span className="inline-flex items-center gap-1 font-semibold text-success">
                  <UserCheck className="size-3" />
                  Level 3 · Case Lead
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active Case</span>
                <span className="font-semibold text-foreground">#{caseMeta.id}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Posture */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/60 pb-3.5">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-success" />
              <CardTitle>Cryptographic Security Posture</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-3.5">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-card/40 p-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7.5 shrink-0 items-center justify-center rounded-md bg-secondary/80 border border-border/50 text-muted-foreground">
                    <item.icon className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="font-mono text-[10.5px] text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-success/10 border border-success/30 px-2 py-0.5 font-mono text-[9.5px] font-bold text-success">
                  <ShieldCheck className="size-3" />
                  SECURED
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Preferences */}
      <Card>
        <CardHeader className="border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <CardTitle>Forensic Engine Policies</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-0.5 pt-2">
          {preferences.map((pref, i) => (
            <div
              key={pref.label}
              className="flex items-center justify-between gap-4 rounded-lg px-2.5 py-3 transition-colors hover:bg-secondary/40"
            >
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {pref.label}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
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

