'use client'

/**
 * Digital Evidence Correlation.
 *
 * Cross-checks phone and tower records against the case timeline. The
 * `agreement` verdict is three-valued on purpose — AGREES / UNCERTAIN /
 * CONFLICTS — because tower positioning is coarse, and forcing a binary answer
 * out of a signal that genuinely cannot support one is how a defensible
 * investigation turns into an indefensible one.
 *
 * Phone numbers are shown masked; the full value is PII and is restricted to
 * roles that need it.
 */

import { Check, HelpCircle, Smartphone, X } from 'lucide-react'

import { PageHeader } from '@/components/pages/page-header'
import { ConfidenceMeter } from '@/components/forensic'
import { AsyncBoundary } from '@/components/states'
import { Stagger, StaggerItem } from '@/components/motion'
import { api } from '@/lib/api/client'
import { useAsync } from '@/lib/hooks/use-api'
import { DEMO_CASE_REF } from '@/lib/case'
import { cn } from '@/lib/utils'

interface Finding {
  uid: string
  title: string
  description: string
  correlation_type: string
  agreement: 'AGREES' | 'UNCERTAIN' | 'CONFLICTS'
  confidence: number
  occurred_at: string | null
  status: string
}

interface Record_ {
  uid: string
  msisdn_masked: string
  counterparty_masked: string | null
  record_type: string
  occurred_at: string
  duration_s: number | null
  tower_label: string | null
}

const AGREEMENT_META = {
  AGREES: { icon: Check, label: 'SOURCES AGREE', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  UNCERTAIN: { icon: HelpCircle, label: 'UNCERTAIN', cls: 'border-amber-400/40 bg-amber-500/10 text-amber-300' },
  CONFLICTS: { icon: X, label: 'SOURCES CONFLICT', cls: 'border-red-500/40 bg-red-500/10 text-red-300' },
} as const

export function CorrelationPage() {
  const { data, loading, error, refetch } = useAsync(
    () => api.raw<{ findings: Finding[]; records: Record_[]; count: number }>(
      `/cases/${DEMO_CASE_REF}/correlation`,
    ),
    [],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Digital Evidence Correlation"
        description="Phone, tower and CCTV records checked against the case timeline."
        meta={
          <span className="font-mono text-[11px] text-muted-foreground">
            {data?.findings?.length ?? 0} findings · {data?.records?.length ?? 0} records
          </span>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={(data?.findings?.length ?? 0) === 0}
        emptyTitle="No digital records correlated"
        emptyDescription="No phone or tower data has been attached to this case yet."
      >
        <div className="space-y-5">
          <Stagger className="space-y-3">
            {(data?.findings ?? []).map((f) => {
              const meta = AGREEMENT_META[f.agreement] ?? AGREEMENT_META.UNCERTAIN
              const Icon = meta.icon
              return (
                <StaggerItem key={f.uid}>
                  <article className="hover-lift space-y-3 rounded-xl border border-border bg-card/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider',
                              meta.cls,
                            )}
                          >
                            <Icon className="size-2.5" aria-hidden="true" />
                            {meta.label}
                          </span>
                          <span className="rounded border border-border bg-secondary/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                            {f.correlation_type.replace(/_/g, ' ')}
                          </span>
                          {f.occurred_at && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {f.occurred_at.slice(11, 16)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{f.title}</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {f.description}
                        </p>
                      </div>
                      <ConfidenceMeter value={f.confidence} />
                    </div>
                  </article>
                </StaggerItem>
              )
            })}
          </Stagger>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              <Smartphone className="size-3.5" aria-hidden="true" />
              Call detail records · numbers masked
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="border-b border-border bg-secondary/40 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  <tr>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Number</th>
                    <th className="px-3 py-2">Counterparty</th>
                    <th className="px-3 py-2">Duration</th>
                    <th className="px-3 py-2">Tower</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.records ?? []).map((r, i) => (
                    <tr
                      key={r.uid}
                      className="stagger-item border-b border-border/50 last:border-0"
                      style={{ ['--stagger-i' as string]: i }}
                    >
                      <td className="px-3 py-2 font-mono tabular-nums text-foreground">
                        {r.occurred_at?.slice(11, 16)}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {r.record_type}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px]">{r.msisdn_masked}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {r.counterparty_masked ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-muted-foreground">
                        {r.duration_s != null ? `${r.duration_s}s` : '—'}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">
                        {r.tower_label ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tower positioning is approximate — typically several hundred metres. A tower
              match places a handset in a area, not at a point, and correlation findings
              are scored accordingly.
            </p>
          </section>
        </div>
      </AsyncBoundary>
    </div>
  )
}
