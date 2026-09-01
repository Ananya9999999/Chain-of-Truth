'use client'

/**
 * Case Closure Readiness.
 *
 * One number, with the arithmetic that produced it visible directly underneath.
 * The gauge is deliberately paired with a factor table showing weight × value =
 * contribution for every input — a score a judge cannot interrogate is a score
 * they should not trust, and this one is designed to be interrogated.
 */

import { Gauge, Info, ShieldAlert } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { PageHeader } from '@/components/pages/page-header'
import { AsyncBoundary } from '@/components/states'
import { Stagger, StaggerItem } from '@/components/motion'
import { api } from '@/lib/api/client'
import { useAsync } from '@/lib/hooks/use-api'
import { DEMO_CASE_REF } from '@/lib/case'
import { cn } from '@/lib/utils'
import type { ReadinessFactor } from '@/lib/types'

export function ReadinessPage() {
  const { data, loading, error, refetch } = useAsync(
    () => api.readiness(DEMO_CASE_REF),
    [],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Case Closure Readiness"
        description="How much unresolved analytical work is outstanding — not a judgement about the case."
      />

      <AsyncBoundary loading={loading} error={error} onRetry={refetch}>
        {data && (
          <div className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <ScoreGauge percent={data.percent} band={data.band} />

              <div className="space-y-3">
                <FactorTable factors={data.factors} />

                {data.blockers.length > 0 && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3">
                    <ShieldAlert
                      className="mt-0.5 size-4 shrink-0 text-amber-300"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold text-amber-200">
                        Blocking items
                      </p>
                      <p className="mt-0.5 text-xs text-amber-200/80">
                        {data.blockers.join(' · ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <CountsGrid counts={data.counts} />

            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-3">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {data.disclaimer}
                </p>
                <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  method: {data.method}
                </p>
              </div>
            </div>
          </div>
        )}
      </AsyncBoundary>
    </div>
  )
}

function ScoreGauge({ percent, band }: { percent: number; band: string }) {
  const reduced = useReducedMotion()
  const radius = 78
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  const tone =
    band === 'INTEGRITY FAILURE'
      ? 'text-red-400'
      : percent >= 85
        ? 'text-emerald-400'
        : percent >= 60
          ? 'text-amber-400'
          : 'text-zinc-400'

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 p-6">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img"
             aria-label={`Readiness ${percent} percent, ${band}`}>
          <circle
            cx="100" cy="100" r={radius}
            fill="none" strokeWidth="12"
            className="stroke-secondary"
          />
          <motion.circle
            cx="100" cy="100" r={radius}
            fill="none" strokeWidth="12" strokeLinecap="round"
            className={cn('stroke-current', tone)}
            transform="rotate(-90 100 100)"
            strokeDasharray={circumference}
            initial={reduced ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Gauge className={cn('mb-1 size-5', tone)} aria-hidden="true" />
          <span className={cn('font-mono text-4xl font-bold tabular-nums', tone)}>
            {percent.toFixed(0)}
            <span className="text-xl">%</span>
          </span>
        </div>
      </div>
      <p className={cn('mt-2 font-mono text-xs font-bold tracking-wider', tone)}>{band}</p>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        Weighted across five measurable factors
      </p>
    </div>
  )
}

function FactorTable({ factors }: { factors: ReadinessFactor[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">
          Readiness factors with weight, value and contribution
        </caption>
        <thead className="border-b border-border bg-secondary/40 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          <tr>
            <th className="px-3 py-2">Factor</th>
            <th className="px-3 py-2 text-right">Weight</th>
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2 text-right">Contribution</th>
          </tr>
        </thead>
        <tbody>
          {/* CSS stagger rather than <StaggerItem>: wrapping <tr> in a motion
              div would break table semantics and screen-reader row navigation. */}
          {factors.map((f, i) => (
            <tr
              key={f.key}
              className="stagger-item border-b border-border/50 last:border-0"
              style={{ ['--stagger-i' as string]: i }}
            >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {f.blocking && (
                      <span
                        className="size-1.5 shrink-0 rounded-full bg-amber-400"
                        aria-label="Blocking"
                      />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{f.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{f.detail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                  {f.weight.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground">
                  {f.value.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-primary">
                  {(f.weight * f.value).toFixed(3)}
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CountsGrid({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts)
  return (
    <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {entries.map(([key, value]) => (
        <StaggerItem key={key}>
          <div className="hover-lift rounded-lg border border-border bg-card/40 p-3">
            <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {key.replace(/_/g, ' ')}
            </p>
            <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
