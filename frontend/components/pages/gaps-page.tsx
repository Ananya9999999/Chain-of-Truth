'use client'

/**
 * Evidence Gaps — what the case is missing.
 *
 * Gaps are the most actionable thing the system produces: unlike a
 * contradiction, a gap has an obvious next step. Each one states what is
 * missing, why it matters, and what to do about it.
 */

import { SearchCode, ArrowRight } from 'lucide-react'

import { PageHeader } from '@/components/pages/page-header'
import { SeverityChip } from '@/components/forensic'
import { AsyncBoundary } from '@/components/states'
import { Stagger, StaggerItem } from '@/components/motion'
import { api } from '@/lib/api/client'
import { useAsync } from '@/lib/hooks/use-api'
import { DEMO_CASE_REF } from '@/lib/case'
import { cn } from '@/lib/utils'

export function GapsPage() {
  const { data, loading, error, refetch } = useAsync(() => api.gaps(DEMO_CASE_REF), [])
  const gaps = data?.gaps ?? []
  const open = gaps.filter((g) => g.status === 'OPEN')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Evidence Gaps"
        description="Material the case does not yet have. Each gap names the step that would close it."
        meta={
          <span className="font-mono text-[11px] text-muted-foreground">
            {open.length} open / {gaps.length} total
          </span>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={gaps.length === 0}
        emptyTitle="No gaps identified"
        emptyDescription="The system has not detected missing material for this case."
      >
        <Stagger className="space-y-3">
          {gaps.map((g) => (
            <StaggerItem key={g.uid}>
              <article
                className={cn(
                  'hover-lift space-y-3 rounded-xl border bg-card/50 p-4',
                  g.status !== 'OPEN'
                    ? 'border-border/60 opacity-70'
                    : g.severity === 'MAJOR' || g.severity === 'CRITICAL'
                      ? 'border-red-500/30'
                      : 'border-border',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityChip severity={g.severity} />
                      <span className="rounded border border-border bg-secondary/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                        {g.gap_type}
                      </span>
                      {g.status !== 'OPEN' && (
                        <span className="font-mono text-[10px] text-emerald-300">CLOSED</span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{g.title}</h4>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {g.description}
                    </p>
                  </div>
                </div>

                {g.suggested_action && (
                  <div className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <ArrowRight
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-mono text-[10px] tracking-wider text-primary uppercase">
                        Suggested next step
                      </p>
                      <p className="mt-0.5 text-xs text-foreground/90">{g.suggested_action}</p>
                    </div>
                  </div>
                )}

                {g.legal_ref && (
                  <p className="font-mono text-[10px] text-muted-foreground">
                    Reference: {g.legal_ref}
                  </p>
                )}
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </AsyncBoundary>

      <p className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <SearchCode className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Gap detection is a checklist aid. It identifies material the system cannot find in
        the case record — it does not assert that the material exists, nor that the
        investigation is deficient without it.
      </p>
    </div>
  )
}
