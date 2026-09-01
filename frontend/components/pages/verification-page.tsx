'use client'

/**
 * Human Verification — the review queue.
 *
 * Everything the AI has produced that still needs a person, in one list, with
 * the reasoning and the confidence attached. Items reserved to a qualified role
 * (a forensic hypothesis, a chargesheet finding) show who may decide them, and
 * the buttons are disabled with a reason rather than silently failing on the
 * server.
 */

import { useState } from 'react'
import { ClipboardCheck, History, ShieldQuestion } from 'lucide-react'

import { PageHeader } from '@/components/pages/page-header'
import {
  AiHypothesisBanner,
  AiProviderBadge,
  ConfidenceMeter,
  SeverityChip,
  StatusChip,
  VerifyActions,
} from '@/components/forensic'
import { AsyncBoundary } from '@/components/states'
import { Stagger, StaggerItem, StateChange } from '@/components/motion'
import { api } from '@/lib/api/client'
import { useAsync, useMutation } from '@/lib/hooks/use-api'
import { DEMO_CASE_REF } from '@/lib/case'
import { getSession } from '@/lib/auth'
import type { Decision, ReviewQueueItem } from '@/lib/types'

/** Maps the session's display role back to the backend role constant. */
function currentRole(): string {
  const label = getSession()?.role ?? 'Investigating Officer'
  return label.toUpperCase().replace(/\s+/g, '_')
}

export function VerificationPage() {
  const queue = useAsync(() => api.reviewQueue(DEMO_CASE_REF), [])
  const history = useAsync(() => api.verificationHistory(DEMO_CASE_REF), [])
  const role = currentRole()

  const items = queue.data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Human Verification"
        description="Every AI finding waiting on a person. Nothing here has affected the case record yet."
        meta={<AiProviderBadge provider={queue.data?.ai_provider} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Awaiting decision" value={items.length} tone="amber" />
        <Stat label="Decisions recorded" value={history.data?.count ?? 0} tone="emerald" />
        <Stat label="Acting as" value={role.replace(/_/g, ' ')} tone="cyan" isText />
      </div>

      <AsyncBoundary
        loading={queue.loading}
        error={queue.error}
        onRetry={queue.refetch}
        isEmpty={items.length === 0}
        emptyTitle="Queue is clear"
        emptyDescription="Every AI finding on this case has an officer decision recorded against it."
      >
        <Stagger className="space-y-3">
          {items.map((item) => (
            <StaggerItem key={item.uid}>
              <QueueCard
                item={item}
                role={role}
                onDecided={() => {
                  queue.refetch()
                  history.refetch()
                }}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </AsyncBoundary>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          <History className="size-3.5" aria-hidden="true" />
          Due-diligence log
        </h3>
        <p className="text-xs text-muted-foreground">
          Every decision, including dismissals. This is what a court sees alongside the
          verified record.
        </p>
        <AsyncBoundary
          loading={history.loading}
          error={history.error}
          onRetry={history.refetch}
          isEmpty={(history.data?.history?.length ?? 0) === 0}
          emptyTitle="No decisions yet"
          emptyDescription="Confirm or dismiss a finding and it will be recorded here permanently."
          loadingRows={2}
        >
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-border bg-secondary/40 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                <tr>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">Decision</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {(history.data?.history ?? []).map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                      {row.decided_at?.slice(0, 16).replace('T', ' ')}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px]">{row.target_type}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          row.decision === 'CONFIRM'
                            ? 'font-mono text-[11px] font-bold text-emerald-300'
                            : row.decision === 'DISMISS'
                              ? 'font-mono text-[11px] font-bold text-zinc-400'
                              : 'font-mono text-[11px] font-bold text-amber-300'
                        }
                      >
                        {row.decision}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground">
                      {row.decided_by_role?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-foreground/80">
                      {row.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncBoundary>
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
  isText,
}: {
  label: string
  value: number | string
  tone: 'amber' | 'emerald' | 'cyan'
  isText?: boolean
}) {
  const toneClass =
    tone === 'amber'
      ? 'text-amber-300'
      : tone === 'emerald'
        ? 'text-emerald-300'
        : 'text-cyan-300'
  return (
    <div className="hover-lift rounded-xl border border-border bg-card/50 p-4">
      <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold ${toneClass} ${isText ? 'text-sm' : 'text-2xl tabular-nums'}`}
      >
        {value}
      </p>
    </div>
  )
}

function QueueCard({
  item,
  role,
  onDecided,
}: {
  item: ReviewQueueItem
  role: string
  onDecided: () => void
}) {
  const [pending, setPending] = useState<Decision | null>(null)
  const verify = useMutation((decision: Decision, reason?: string) =>
    api.verify(DEMO_CASE_REF, item.target_type, item.uid, decision, reason),
  )

  const restricted = item.requires_role && !item.requires_role.includes(role)

  async function decide(decision: Decision) {
    setPending(decision)
    const reason = window.prompt('Reason for the record (optional):') ?? undefined
    const result = await verify.run(decision, reason)
    setPending(null)
    if (result) onDecided()
  }

  return (
    <StateChange statusKey={item.status}>
      <article className="hover-lift space-y-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-border bg-secondary/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                {item.target_type.replace(/_/g, ' ')}
              </span>
              <SeverityChip severity={item.severity} />
              <StatusChip status={item.status} size="sm" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
          </div>
          <ConfidenceMeter value={item.confidence} />
        </div>

        {item.disclaimer && <AiHypothesisBanner text={item.disclaimer} />}

        <div className="rounded-lg border border-border/70 bg-background/50 p-3">
          <p className="mb-1 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            Why the system raised this
          </p>
          <p className="text-xs leading-relaxed text-foreground/85">{item.explanation}</p>
        </div>

        <div className="border-t border-border/60 pt-3">
          <VerifyActions
            onDecision={decide}
            pending={pending}
            disabled={!!restricted}
            disabledReason={
              restricted
                ? `Reserved for ${item.requires_role?.map((r) => r.replace(/_/g, ' ')).join(' or ')}. Your role cannot decide this.`
                : undefined
            }
          />
        </div>

        {verify.error != null && (
          <p role="alert" className="flex items-center gap-1.5 text-xs text-red-300">
            <ShieldQuestion className="size-3.5" aria-hidden="true" />
            That decision was refused. Nothing changed.
          </p>
        )}
      </article>
    </StateChange>
  )
}
