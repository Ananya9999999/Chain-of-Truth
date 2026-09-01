'use client'

/**
 * Contradiction review — the moment the whole product is built around.
 *
 * Every flag shows both conflicting excerpts side by side, the severity, the
 * confidence, and the AI's reasoning in plain words. The officer confirms,
 * dismisses, or escalates; whichever they choose is recorded permanently and
 * the flag itself is never deleted.
 *
 * Dismissed flags stay on screen, greyed, with the officer's reason attached.
 * That is the point: a court sees both what the machine noticed and what the
 * human decided about it.
 */

import { useState } from 'react'
import { AlertTriangle, ArrowLeftRight, ChevronDown, ScrollText } from 'lucide-react'

import { PageHeader } from '@/components/pages/page-header'
import {
  AiProviderBadge,
  ConfidenceMeter,
  LayerLegend,
  SeverityChip,
  SourceExcerpt,
  StatusChip,
  VerifyActions,
} from '@/components/forensic'
import { AsyncBoundary, EmptyState } from '@/components/states'
import { Expandable, Stagger, StaggerItem, StateChange } from '@/components/motion'
import { api } from '@/lib/api/client'
import { useAsync, useMutation } from '@/lib/hooks/use-api'
import { DEMO_CASE_REF } from '@/lib/case'
import { cn } from '@/lib/utils'
import type { Contradiction, Decision } from '@/lib/types'

export function ContradictionsPage() {
  const { data, loading, error, refetch } = useAsync(
    () => api.contradictions(DEMO_CASE_REF),
    [],
  )
  const contradictions = data?.contradictions ?? []
  const open = contradictions.filter((c) => c.status === 'REQUIRES_REVIEW')
  const answered = contradictions.filter((c) => c.status !== 'REQUIRES_REVIEW')

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contradiction Detector"
        description="Conflicts found between pieces of evidence. A flag is a prompt to look closer — never a verdict."
        meta={<AiProviderBadge provider={data?.ai_provider} />}
      />

      <LayerLegend />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={refetch}
        isEmpty={contradictions.length === 0}
        emptyTitle="No contradictions detected"
        emptyDescription="Nothing in the current evidence conflicts. Upload another item to run the comparison again."
      >
        <div className="space-y-6">
          {open.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-amber-300 uppercase">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Awaiting your decision · {open.length}
              </h3>
              <Stagger className="space-y-3">
                {open.map((c) => (
                  <StaggerItem key={c.uid}>
                    <ContradictionCard item={c} onResolved={refetch} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {answered.length > 0 && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                <ScrollText className="size-3.5" aria-hidden="true" />
                Answered · {answered.length} · retained for the record
              </h3>
              <Stagger className="space-y-3">
                {answered.map((c) => (
                  <StaggerItem key={c.uid}>
                    <ContradictionCard item={c} onResolved={refetch} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {open.length === 0 && answered.length > 0 && (
            <EmptyState
              title="Every flag has been answered"
              description="All AI-flagged contradictions have an officer decision recorded against them."
            />
          )}
        </div>
      </AsyncBoundary>
    </div>
  )
}

function ContradictionCard({
  item,
  onResolved,
}: {
  item: Contradiction
  onResolved: () => void
}) {
  const [expanded, setExpanded] = useState(item.status === 'REQUIRES_REVIEW')
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null)

  const verify = useMutation((decision: Decision, reason?: string) =>
    api.verify(DEMO_CASE_REF, 'CONTRADICTION', item.uid, decision, reason),
  )

  const resolved = item.status !== 'REQUIRES_REVIEW'
  const dismissed = item.status === 'DISMISSED'
  const sideA = item.sources.find((s) => s.side === 'A')
  const sideB = item.sources.find((s) => s.side === 'B')

  async function decide(decision: Decision) {
    setPendingDecision(decision)
    const reason =
      decision === 'DISMISS'
        ? window.prompt('Reason for dismissing this flag (recorded permanently):') ?? undefined
        : decision === 'REQUEST_REVIEW'
          ? window.prompt('What needs a second look?') ?? undefined
          : window.prompt('Note for the record (optional):') ?? undefined

    const result = await verify.run(decision, reason)
    setPendingDecision(null)
    if (result) onResolved()
  }

  return (
    <StateChange statusKey={item.status}>
      <article
        className={cn(
          'hover-lift relative overflow-hidden rounded-xl border transition-colors',
          dismissed
            ? 'border-border/60 bg-card/30 opacity-75'
            : item.severity === 'MAJOR' || item.severity === 'CRITICAL'
              ? 'border-red-500/35 bg-red-500/[0.04]'
              : 'border-amber-400/35 bg-amber-500/[0.04]',
        )}
      >
        {/* Status stripe: colour plus the chip below, never colour alone. */}
        <div
          className={cn(
            'h-0.5 w-full',
            dismissed
              ? 'bg-zinc-600'
              : item.status === 'HUMAN_CONFIRMED'
                ? 'bg-emerald-400'
                : 'bg-amber-400',
          )}
          aria-hidden="true"
        />

        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityChip severity={item.severity} />
                <StatusChip status={item.status} size="sm" />
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  {item.contradiction_type}
                </span>
              </div>
              <h4 className="text-sm leading-snug font-semibold text-foreground">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <ConfidenceMeter value={item.confidence} />
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="btn-press inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {expanded ? 'Hide' : 'Show'} sources
                <ChevronDown
                  className={cn('size-3 transition-transform', expanded && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <Expandable open={expanded}>
            <div className="space-y-3 pt-1">
              <div className="grid gap-3 md:grid-cols-2">
                {sideA && (
                  <SourceExcerpt
                    label="Source A"
                    excerpt={sideA.excerpt}
                    evidenceRef={sideA.evidence_id}
                  />
                )}
                {sideB && (
                  <SourceExcerpt
                    label="Source B"
                    excerpt={sideB.excerpt}
                    evidenceRef={sideB.evidence_id}
                  />
                )}
              </div>

              <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  <ArrowLeftRight className="size-3" aria-hidden="true" />
                  Why the system flagged this
                </p>
                <p className="text-xs leading-relaxed text-foreground/85">
                  {item.explanation}
                </p>
              </div>
            </div>
          </Expandable>

          {resolved ? (
            <div className="rounded-lg border border-border/70 bg-background/50 px-3 py-2">
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Officer decision · {item.resolved_at?.slice(0, 16).replace('T', ' ')}
              </p>
              <p className="mt-0.5 text-xs text-foreground/85">
                {item.resolution_note || 'No reason recorded.'}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                The AI finding above is retained unchanged — dismissal marks it, it does
                not erase it.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
              <VerifyActions onDecision={decide} pending={pendingDecision} />
              <p className="text-[10px] text-muted-foreground">
                Both confirmation and dismissal are recorded permanently.
              </p>
            </div>
          )}

          {verify.error != null && (
            <p role="alert" className="text-xs text-red-300">
              Could not record that decision. Nothing was changed — please retry.
            </p>
          )}
        </div>
      </article>
    </StateChange>
  )
}
