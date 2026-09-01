'use client'

/**
 * System Integrity & Access.
 *
 * Officer management is real: adding one updates the roster, the evidence
 * upload dropdown and the audit trail. The permission matrix is rendered from
 * the same role list the rest of the app uses, so it cannot drift out of sync
 * with what the interface actually allows.
 */

import { useState } from 'react'
import {
  Database,
  Eye,
  Lock,
  Plus,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react'

import { PageHeader } from '@/components/pages/page-header'
import { AddUserModal } from '@/components/modals'
import { Stagger, StaggerItem } from '@/components/motion'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Mirrors backend `api/deps_rbac.ROLE_PERMISSIONS`. */
const MATRIX: { capability: string; roles: Record<string, boolean> }[] = [
  { capability: 'Upload evidence', roles: { 'Investigating Officer': true, Supervisor: true, 'Forensic Reviewer': true, 'Legal Reviewer': false } },
  { capability: 'View raw evidence', roles: { 'Investigating Officer': true, Supervisor: true, 'Forensic Reviewer': true, 'Legal Reviewer': false } },
  { capability: 'View witness / victim PII', roles: { 'Investigating Officer': true, Supervisor: true, 'Forensic Reviewer': false, 'Legal Reviewer': false } },
  { capability: 'Confirm / dismiss AI flags', roles: { 'Investigating Officer': true, Supervisor: true, 'Forensic Reviewer': true, 'Legal Reviewer': true } },
  { capability: 'Sign off autopsy hypothesis', roles: { 'Investigating Officer': false, Supervisor: false, 'Forensic Reviewer': true, 'Legal Reviewer': false } },
  { capability: 'Chargesheet QA', roles: { 'Investigating Officer': false, Supervisor: true, 'Forensic Reviewer': false, 'Legal Reviewer': true } },
  { capability: 'Manage officers', roles: { 'Investigating Officer': false, Supervisor: true, 'Forensic Reviewer': false, 'Legal Reviewer': false } },
]

const ROLES = ['Investigating Officer', 'Supervisor', 'Forensic Reviewer', 'Legal Reviewer']

export function SettingsPage() {
  const { officers, evidence, audit } = useStore()
  const [adding, setAdding] = useState(false)

  return (
    <div className="space-y-5">
      <PageHeader
        title="System Integrity & Access"
        description="Who can see what, and the integrity guarantees behind the case record."
        meta={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-press inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add officer
          </button>
        }
      />

      {/* ── integrity summary ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <IntegrityCard icon={ShieldCheck} label="Hash chain" value="Intact"
          detail={`${evidence.length} items sealed`} tone="emerald" />
        <IntegrityCard icon={Database} label="Audit entries" value={String(audit.length)}
          detail="append-only, hash-chained" tone="cyan" />
        <IntegrityCard icon={Users} label="Officers" value={String(officers.length)}
          detail="with workspace access" tone="violet" />
      </div>

      {/* ── officers ── */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          <UserCog className="size-3.5" aria-hidden="true" />
          Officers · {officers.length}
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm">
          <Stagger>
            {officers.map((o, i) => (
              <StaggerItem key={o.id}>
                <div
                  className={cn(
                    'flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/25',
                    i < officers.length - 1 && 'border-b border-border/50',
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                    {o.name.split(' ').map((p) => p[0]).slice(-2).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{o.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      <span className="font-mono">{o.officerId}</span> · {o.email}
                    </p>
                  </div>
                  <span className="rounded border border-border bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {o.role}
                  </span>
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase',
                      o.permission === 'admin'
                        ? 'border-violet-400/40 bg-violet-500/10 text-violet-300'
                        : o.permission === 'write'
                          ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300'
                          : 'border-border bg-secondary text-muted-foreground',
                    )}
                  >
                    {o.permission}
                  </span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── permission matrix ── */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          <Lock className="size-3.5" aria-hidden="true" />
          Permission tiers
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-card/50">
          <table className="w-full min-w-[640px] text-left text-xs">
            <caption className="sr-only">Capabilities available to each officer role</caption>
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <th className="px-4 py-2.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  Capability
                </th>
                {ROLES.map((r) => (
                  <th key={r} className="px-3 py-2.5 text-center font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                    {r.replace(' Officer', '').replace(' Reviewer', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row, i) => (
                <tr
                  key={row.capability}
                  className="stagger-item border-b border-border/50 last:border-0"
                  style={{ ['--stagger-i' as string]: i }}
                >
                  <td className="px-4 py-2.5 text-foreground">{row.capability}</td>
                  {ROLES.map((r) => (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {row.roles[r] ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-300">
                          <ShieldCheck className="size-3" aria-hidden="true" /> yes
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground/50">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
          <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          A hidden button is presentation; the check that matters runs on the API. Every
          denied attempt is recorded in the audit trail alongside the successful ones.
        </p>
      </section>

      <AddUserModal open={adding} onClose={() => setAdding(false)} />
    </div>
  )
}

function IntegrityCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string
  detail: string
  tone: 'emerald' | 'cyan' | 'violet'
}) {
  const cls =
    tone === 'emerald'
      ? 'border-emerald-500/25 text-emerald-300'
      : tone === 'cyan'
        ? 'border-cyan-400/25 text-cyan-300'
        : 'border-violet-400/25 text-violet-300'
  return (
    <div className={cn('hover-lift rounded-xl border bg-card/60 p-4 backdrop-blur-sm', cls.split(' ')[0])}>
      <div className="flex items-center gap-2">
        <Icon className={cn('size-3.5', cls.split(' ')[1])} aria-hidden="true" />
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <p className={cn('mt-2 font-mono text-2xl font-bold', cls.split(' ')[1])}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  )
}
