'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { timelineEvents, type TimelineEvent } from '@/lib/mock-data'
import {
  FileText,
  MessageSquareText,
  Video,
  MapPin,
  Sparkles,
  Activity,
  ChevronDown,
  Clock3,
  ShieldCheck,
  BrainCircuit,
  Fingerprint,
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
  const [expanded, setExpanded] = useState<string | null>(null)

  const verifiedCount = timelineEvents.filter(
    (event) => event.status !== 'ai-extracted',
  ).length

  const aiCount = timelineEvents.filter(
    (event) => event.status === 'ai-extracted',
  ).length

  return (
    <>
      <style jsx>{`
        @keyframes timelineReveal {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes timelinePulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.9);
          }

          50% {
            opacity: 1;
            transform: scale(1.12);
          }
        }

        @keyframes timelineFlow {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }

          20% {
            opacity: 0.9;
          }

          80% {
            opacity: 0.25;
          }

          100% {
            transform: translateY(500%);
            opacity: 0;
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateX(-150%);
          }

          100% {
            transform: translateX(500%);
          }
        }

        @keyframes glow {
          0%,
          100% {
            opacity: 0.25;
          }

          50% {
            opacity: 0.8;
          }
        }

        .timeline-reveal {
          animation: timelineReveal 0.7s
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .timeline-pulse {
          animation: timelinePulse 2.2s ease-in-out infinite;
        }

        .timeline-flow {
          animation: timelineFlow 3s linear infinite;
        }

        .scan-line {
          animation: scanLine 4s ease-in-out infinite;
        }

        .timeline-glow {
          animation: glow 2.5s ease-in-out infinite;
        }

        .timeline-event {
          transition:
            transform 250ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 250ms ease,
            background-color 250ms ease,
            box-shadow 250ms ease;
        }

        .timeline-event:hover {
          transform: translateX(3px);
        }

        @media (prefers-reduced-motion: reduce) {
          .timeline-reveal,
          .timeline-pulse,
          .timeline-flow,
          .scan-line,
          .timeline-glow {
            animation: none;
          }
        }
      `}</style>

      <Card className="timeline-reveal relative overflow-hidden border-border/70 bg-card/45 shadow-lg backdrop-blur-xl">

        {/* ================================================= */}
        {/* BACKGROUND GRID */}
        {/* ================================================= */}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(100,180,210,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(100,180,210,0.012)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-primary/[0.035] blur-3xl" />


        {/* ================================================= */}
        {/* TOP SCANNER */}
        {/* ================================================= */}

        <div className="relative h-0.5 overflow-hidden bg-secondary/50">

          <div className="scan-line absolute h-full w-1/4 bg-primary/60 shadow-[0_0_14px_rgba(34,211,238,0.5)]" />

        </div>


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <CardHeader className="relative border-b border-border/60 pb-4">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div className="flex items-start gap-2.5">

              <div className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/[0.07] text-primary">

                <Activity className="size-4" />

                <span className="timeline-pulse absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" />

              </div>


              <div>

                <div className="flex items-center gap-2">

                  <CardTitle className="text-sm">
                    Chronological Investigation Timeline
                  </CardTitle>

                  <span className="hidden rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-primary sm:inline-block">
                    LIVE STREAM
                  </span>

                </div>

                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Interleaved verified facts and AI working-analysis hypotheses
                </p>

              </div>

            </div>


            {/* LEGEND */}

            <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">

              <span className="flex items-center gap-1.5">

                <span className="size-1.5 rounded-full bg-success shadow-[0_0_7px_rgba(34,197,94,0.45)]" />

                {verifiedCount} Verified

              </span>

              <span className="flex items-center gap-1.5">

                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_7px_rgba(34,211,238,0.45)]" />

                {aiCount} AI Layer

              </span>

            </div>

          </div>


          {/* STATUS STRIP */}

          <div className="mt-4 grid grid-cols-3 gap-2">

            <TimelineStat
              icon={Fingerprint}
              label="Records"
              value={`${timelineEvents.length}`}
            />

            <TimelineStat
              icon={ShieldCheck}
              label="Verified"
              value={`${verifiedCount}`}
              success
            />

            <TimelineStat
              icon={BrainCircuit}
              label="AI Signals"
              value={`${aiCount}`}
              primary
            />

          </div>

        </CardHeader>


        {/* ================================================= */}
        {/* TIMELINE */}
        {/* ================================================= */}

        <CardContent className="relative pt-5">

          <ol className="relative space-y-1">

            {/* animated vertical signal */}

            <span className="pointer-events-none absolute left-[15px] top-2 h-[calc(100%-10px)] w-px overflow-hidden bg-border/70">

              <span className="timeline-flow absolute left-0 top-0 h-1/4 w-full bg-primary/70 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />

            </span>


            {timelineEvents.map((ev, index) => {

              const Icon = typeIcon[ev.type]
              const isAI = ev.status === 'ai-extracted'
              const isExpanded = expanded === ev.id
              const isLatest = index === 0

              return (

                <li
                  key={ev.id}
                  className="relative flex gap-3.5 pb-5 last:pb-0"
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                >

                  {/* ================================================= */}
                  {/* NODE */}
                  {/* ================================================= */}

                  <div className="relative z-10 shrink-0">

                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full border shadow-sm transition-all duration-300',
                        isAI
                          ? 'border-primary/45 bg-primary/10 text-primary'
                          : 'border-success/30 bg-success/[0.06] text-success',
                        isLatest && 'ring-4 ring-primary/[0.06]',
                      )}
                    >

                      <Icon className="size-3.5" />

                    </div>


                    {isLatest && (

                      <span className="timeline-pulse absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(34,211,238,0.6)]" />

                    )}

                  </div>


                  {/* ================================================= */}
                  {/* EVENT CARD */}
                  {/* ================================================= */}

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(
                        isExpanded ? null : ev.id,
                      )
                    }
                    className={cn(
                      'timeline-event relative flex-1 cursor-pointer rounded-xl border p-3.5 text-left',
                      isAI
                        ? 'border-primary/20 bg-primary/[0.025] hover:border-primary/40 hover:bg-primary/[0.04]'
                        : 'border-border/60 bg-background/15 hover:border-success/20 hover:bg-card/50',
                      isExpanded &&
                        'border-primary/30 bg-primary/[0.035] shadow-md',
                    )}
                  >

                    {/* AI accent */}

                    {isAI && (

                      <span className="absolute inset-y-0 left-0 w-0.5 bg-primary/60" />

                    )}


                    {/* VERIFIED accent */}

                    {!isAI && (

                      <span className="absolute inset-y-0 left-0 w-0.5 bg-success/30" />

                    )}


                    {/* scan effect */}

                    {isExpanded && (

                      <span className="scan-line pointer-events-none absolute left-0 top-0 h-px w-1/3 bg-primary/60" />

                    )}


                    {/* ================================================= */}
                    {/* EVENT HEADER */}
                    {/* ================================================= */}

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-foreground/90">

                          <Clock3 className="size-3 text-muted-foreground/60" />

                          {ev.date} · {ev.time}

                        </span>

                        <StatusBadge status={ev.status} />

                      </div>


                      <div className="flex items-center gap-2">

                        {ev.confidence !== undefined && (

                          <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] text-primary">

                            CONFIDENCE

                            <span className="font-black">
                              {ev.confidence}%
                            </span>

                          </span>

                        )}

                        <ChevronDown
                          className={cn(
                            'size-3 text-muted-foreground transition-transform duration-200',
                            isExpanded && 'rotate-180 text-primary',
                          )}
                        />

                      </div>

                    </div>


                    {/* ================================================= */}
                    {/* TITLE */}
                    {/* ================================================= */}

                    <div className="mt-2 flex items-center gap-2">

                      <p className="text-[11px] font-bold tracking-tight text-foreground">

                        {ev.title}

                      </p>

                      {isLatest && (

                        <span className="rounded border border-primary/20 bg-primary/10 px-1 py-0.5 font-mono text-[6.5px] font-bold text-primary">

                          CURRENT

                        </span>

                      )}

                    </div>


                    {/* ================================================= */}
                    {/* DESCRIPTION */}
                    {/* ================================================= */}

                    <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">

                      {ev.description}

                    </p>


                    {/* ================================================= */}
                    {/* SOURCE */}
                    {/* ================================================= */}

                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/40 pt-2.5">

                      <div className="flex min-w-0 items-center gap-1.5">

                        <span className="font-mono text-[7.5px] uppercase tracking-wider text-muted-foreground/60">

                          Origin

                        </span>

                        <span className="truncate font-mono text-[8px] font-semibold text-foreground/75">

                          {ev.source}

                        </span>

                      </div>


                      <span
                        className={cn(
                          'flex shrink-0 items-center gap-1 font-mono text-[7px] font-bold uppercase tracking-wider',
                          isAI
                            ? 'text-primary'
                            : 'text-success',
                        )}
                      >

                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            isAI
                              ? 'bg-primary'
                              : 'bg-success',
                          )}
                        />

                        {isAI ? 'AI WORKING' : 'VERIFIED'}

                      </span>

                    </div>


                    {/* ================================================= */}
                    {/* EXPANDED FORENSIC DETAILS */}
                    {/* ================================================= */}

                    {isExpanded && (

                      <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/40 pt-3 sm:grid-cols-3">

                        <DetailBox
                          label="Event ID"
                          value={ev.id}
                        />

                        <DetailBox
                          label="Classification"
                          value={
                            isAI
                              ? 'Working Hypothesis'
                              : 'Verified Record'
                          }
                        />

                        <DetailBox
                          label="Source"
                          value={ev.source}
                        />

                      </div>

                    )}

                  </button>

                </li>

              )
            })}

          </ol>


          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-3">

            <span className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-wider text-muted-foreground">

              <Activity className="size-3 text-primary" />

              Chronological stream synchronized

            </span>

            <span className="flex items-center gap-1.5 font-mono text-[7px] font-bold text-success">

              <ShieldCheck className="size-3" />

              RECORD INTEGRITY VERIFIED

            </span>

          </div>

        </CardContent>

      </Card>
    </>
  )
}


/* ===================================================== */
/* STAT */
/* ===================================================== */

function TimelineStat({
  icon: Icon,
  label,
  value,
  success,
  primary,
}: {
  icon: React.ElementType
  label: string
  value: string
  success?: boolean
  primary?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-background/20 p-2',
        success
          ? 'border-success/15'
          : primary
            ? 'border-primary/15'
            : 'border-border/50',
      )}
    >

      <div className="flex items-center gap-1.5">

        <Icon
          className={cn(
            'size-3',
            success
              ? 'text-success'
              : primary
                ? 'text-primary'
                : 'text-muted-foreground',
          )}
        />

        <span className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>

      </div>

      <p className="mt-1 font-mono text-[10px] font-bold text-foreground">
        {value}
      </p>

    </div>
  )
}


/* ===================================================== */
/* DETAIL BOX */
/* ===================================================== */

function DetailBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/20 p-2">

      <p className="font-mono text-[6.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 truncate font-mono text-[8px] font-bold text-foreground">
        {value}
      </p>

    </div>
  )
}