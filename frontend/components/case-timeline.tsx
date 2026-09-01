import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const typeIcon: Record<TimelineEvent['type'], React.ElementType> = {
  evidence: FileText,
  witness: MessageSquareText,
  cctv: Video,
  location: MapPin,
  ai: Sparkles,
}

export function CaseTimeline() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Case Timeline</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Chronological record · verified facts and AI working-analysis layer
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" /> Verified
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" /> AI layer
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-1">
          {timelineEvents.map((ev, i) => {
            const Icon = typeIcon[ev.type]
            const isAI = ev.status === 'ai-extracted'
            return (
              <li key={ev.id} className="relative flex gap-4 pb-5 last:pb-0 stagger-item" style={{ ['--stagger-i' as string]: i }}>
                {i < timelineEvents.length - 1 && (
                  <span className="absolute top-9 left-[15px] h-full w-px bg-border" />
                )}
                <div
                  className={cn(
                    'z-10 flex size-8 shrink-0 items-center justify-center rounded-full border',
                    isAI
                      ? 'border-primary/40 bg-primary/12 text-primary'
                      : 'border-border bg-secondary text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <div
                  className={cn(
                    'flex-1 rounded-lg border p-3.5 transition-all duration-200 hover-lift',
                    isAI
                      ? 'border-primary/25 bg-primary/[0.04] hover:border-primary/40'
                      : 'border-border bg-card/40 hover:border-border/80',
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
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {ev.title}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {ev.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2 font-mono text-[11px] text-muted-foreground">
                    <span className="text-muted-foreground/70">source:</span>
                    {ev.source}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
