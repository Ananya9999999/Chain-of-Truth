import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/pages/page-header'
import { StatusBadge } from '@/components/status-badge'
import { timelineEvents, type TimelineEvent } from '@/lib/mock-data'
import {
  FileText,
  MessageSquareText,
  Video,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const typeIcon: Record<TimelineEvent['type'], LucideIcon> = {
  evidence: FileText,
  witness: MessageSquareText,
  cctv: Video,
  location: MapPin,
  ai: Sparkles,
}

export function TimelinePage() {
  const verifiedCount = timelineEvents.filter(
    (e) => e.status === 'verified',
  ).length
  const aiCount = timelineEvents.filter(
    (e) => e.status === 'ai-extracted',
  ).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="Case Timeline"
        description="A single chronological record. Verified facts and AI working-analysis events are interleaved by time but always visually distinct — the AI layer never merges into the verified record."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/12 px-2.5 py-1 text-[11px] font-semibold text-success">
              <span className="size-2 rounded-full bg-success" />
              {verifiedCount} verified
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              {aiCount} AI events
            </span>
          </>
        }
      />

      <ol className="relative">
        {timelineEvents.map((ev, i) => {
          const Icon = typeIcon[ev.type]
          const isAI = ev.status === 'ai-extracted'
          return (
            <li key={ev.id} className="relative flex gap-4 pb-5 last:pb-0">
              {i < timelineEvents.length - 1 && (
                <span className="absolute top-10 left-[19px] h-full w-px bg-border" />
              )}
              <div
                className={cn(
                  'z-10 flex size-10 shrink-0 items-center justify-center rounded-full border',
                  isAI
                    ? 'border-primary/40 bg-primary/12 text-primary'
                    : 'border-border bg-secondary text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
              </div>

              <div
                className={cn(
                  'flex-1 rounded-lg border p-4 transition-colors',
                  isAI
                    ? 'border-primary/25 bg-primary/[0.04] hover:border-primary/40'
                    : 'border-border bg-card hover:border-border/80',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {ev.date} · {ev.time}
                    </span>
                    <StatusBadge status={ev.status} />
                  </div>
                  {ev.confidence !== undefined && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      confidence{' '}
                      <span className="font-semibold text-primary">
                        {ev.confidence}%
                      </span>
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {ev.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {ev.description}
                </p>
                <p className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2.5 font-mono text-[11px] text-muted-foreground">
                  <span className="text-muted-foreground/70">source:</span>
                  {ev.source}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
