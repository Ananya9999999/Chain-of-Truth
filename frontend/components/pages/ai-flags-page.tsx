'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Button } from '@/components/ui/button'
import { aiFlags, type AiFlag } from '@/lib/mock-data'
import { caseMeta } from '@/lib/mock-data'
import {
  Flag,
  Check,
  X,
  ShieldCheck,
  FileSearch,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Resolution = 'pending' | 'confirmed' | 'dismissed'

const severityStyle: Record<AiFlag['severity'], string> = {
  high: 'border-danger/30 bg-danger/12 text-danger',
  medium: 'border-warning/30 bg-warning/12 text-warning',
  low: 'border-border bg-secondary text-muted-foreground',
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AiFlagsPage() {
  const [responses, setResponses] = useState<Record<string, Resolution>>(
    Object.fromEntries(aiFlags.map((f) => [f.id, f.response])),
  )
  const [times, setTimes] = useState<Record<string, string>>({})

  function resolve(id: string, r: Resolution) {
    setResponses((prev) => ({ ...prev, [id]: r }))
    setTimes((prev) => ({ ...prev, [id]: nowTime() }))
  }

  const pending = Object.values(responses).filter((r) => r === 'pending').length

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Flags"
        description="Contradictions and hypotheses surfaced by the analysis layer. Each is a labelled hypothesis outside the verified record until an officer confirms or dismisses it."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/12 px-2.5 py-1 text-[11px] font-semibold text-warning">
            <Flag className="size-3.5" />
            {pending} awaiting review
          </span>
        }
      />

      <div className="rounded-lg border border-primary/25 bg-primary/[0.05] px-4 py-3 text-[13px] leading-relaxed text-foreground">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary">
          <Sparkles className="size-3.5" />
          HYPOTHESIS — REQUIRES HUMAN REVIEW
        </span>
        <p className="mt-1 text-muted-foreground">
          AI assists. Humans decide. Every decision below is written to the
          immutable audit trail.
        </p>
      </div>

      <div className="space-y-4">
        {aiFlags.map((flag) => {
          const resolution = responses[flag.id]
          const confirmed = resolution === 'confirmed'
          const dismissed = resolution === 'dismissed'
          const resolved = resolution !== 'pending'
          return (
            <div
              key={flag.id}
              className={cn(
                'relative overflow-hidden rounded-xl border p-5 transition-colors',
                confirmed
                  ? 'border-danger/40 bg-danger/[0.05]'
                  : dismissed
                    ? 'border-border bg-card/60'
                    : 'border-border bg-card',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Flag className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {flag.title}
                    </h2>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      Flag {flag.id} · AI analysis layer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-md border px-2 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase',
                      severityStyle[flag.severity],
                    )}
                  >
                    Severity · {flag.severity}
                  </span>
                  <span className="rounded-md border border-border bg-secondary px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Confidence · {flag.confidence}%
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Explanation:{' '}
                </span>
                {flag.explanation}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <FileSearch className="size-3.5" />
                  source evidence:
                </span>
                {flag.sources.map((s) => (
                  <span
                    key={s}
                    className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {!resolved ? (
                <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-border/60 pt-4">
                  <Button
                    onClick={() => resolve(flag.id, 'confirmed')}
                    className="bg-danger text-danger-foreground hover:bg-danger/90"
                  >
                    <Check className="size-4" />
                    Confirm flag
                  </Button>
                  <Button
                    onClick={() => resolve(flag.id, 'dismissed')}
                    variant="outline"
                  >
                    <X className="size-4" />
                    Dismiss
                  </Button>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                    status: awaiting officer response
                  </span>
                </div>
              ) : (
                <div
                  className={cn(
                    'mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5',
                    confirmed
                      ? 'border-danger/30 bg-danger/10'
                      : 'border-border bg-secondary/50',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full',
                        confirmed
                          ? 'bg-danger/20 text-danger'
                          : 'bg-muted-foreground/15 text-muted-foreground',
                      )}
                    >
                      {confirmed ? (
                        <Check className="size-4" />
                      ) : (
                        <X className="size-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {confirmed ? 'Confirmed by Officer' : 'Dismissed by Officer'}
                      </p>
                      <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                        <ShieldCheck className="size-3 text-success" />
                        Logged to audit trail · {times[flag.id] ?? nowTime()} ·{' '}
                        {caseMeta.officer}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => resolve(flag.id, 'pending')}
                  >
                    Undo
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
