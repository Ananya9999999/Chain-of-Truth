'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { StatusBadge } from '@/components/status-badge'
import { timelineEvents, type TimelineEvent } from '@/lib/mock-data'
import {
  FileText,
  MessageSquareText,
  Video,
  MapPin,
  Sparkles,
  Activity,
  Radio,
  GitBranch,
  ShieldCheck,
  Clock3,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const typeIcon: Record<TimelineEvent['type'], React.ElementType> = {
  evidence: FileText,
  witness: MessageSquareText,
  cctv: Video,
  location: MapPin,
  ai: Sparkles,
}

function AnimatedConfidence({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let current = 0

    const timer = setInterval(() => {
      current += Math.max(1, Math.ceil(value / 25))

      if (current >= value) {
        current = value
        clearInterval(timer)
      }

      setDisplay(current)
    }, 30)

    return () => clearInterval(timer)
  }, [value])

  return <>{display}</>
}

export function TimelinePage() {
  const verifiedCount = timelineEvents.filter(
    (e) => e.status === 'verified',
  ).length

  const aiCount = timelineEvents.filter(
    (e) => e.status === 'ai-extracted',
  ).length

  return (
    <>
      <style jsx>{`
        @keyframes pageReveal {
          from {
            opacity: 0;
            transform: translateY(22px);
            filter: blur(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes eventReveal {
          from {
            opacity: 0;
            transform: translateX(-20px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes lineGrow {
          from {
            transform: scaleY(0);
            transform-origin: top;
          }

          to {
            transform: scaleY(1);
            transform-origin: top;
          }
        }

        @keyframes nodePulse {
          0%,
          100% {
            transform: scale(0.9);
            box-shadow: 0 0 0 rgba(34, 211, 238, 0);
          }

          50% {
            transform: scale(1.08);
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.12);
          }
        }

        @keyframes verifiedPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(34, 197, 94, 0);
          }

          50% {
            box-shadow: 0 0 18px rgba(34, 197, 94, 0.12);
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-130%);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          80% {
            opacity: 0.3;
          }

          100% {
            transform: translateX(450%);
            opacity: 0;
          }
        }

        @keyframes flow {
          from {
            transform: translateY(-100%);
          }

          to {
            transform: translateY(350%);
          }
        }

        @keyframes signal {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes aiGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(34, 211, 238, 0);
          }

          50% {
            box-shadow:
              0 0 28px rgba(34, 211, 238, 0.07),
              inset 0 0 20px rgba(34, 211, 238, 0.02);
          }
        }

        .timeline-page {
          animation: pageReveal 0.7s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .timeline-event {
          opacity: 0;
          animation: eventReveal 0.65s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .timeline-event:nth-child(1) {
          animation-delay: 0.1s;
        }

        .timeline-event:nth-child(2) {
          animation-delay: 0.2s;
        }

        .timeline-event:nth-child(3) {
          animation-delay: 0.3s;
        }

        .timeline-event:nth-child(4) {
          animation-delay: 0.4s;
        }

        .timeline-event:nth-child(5) {
          animation-delay: 0.5s;
        }

        .timeline-event:nth-child(6) {
          animation-delay: 0.6s;
        }

        .timeline-event:nth-child(7) {
          animation-delay: 0.7s;
        }

        .timeline-event:nth-child(8) {
          animation-delay: 0.8s;
        }

        .timeline-line {
          animation: lineGrow 1.8s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .ai-node {
          animation: nodePulse 2.2s ease-in-out infinite;
        }

        .verified-node {
          animation: verifiedPulse 2.8s ease-in-out infinite;
        }

        .scan-line {
          animation: scan 3.5s ease-in-out infinite;
        }

        .vertical-flow {
          animation: flow 3s linear infinite;
        }

        .signal {
          animation: signal 1.8s ease-in-out infinite;
        }

        .ai-card {
          animation: aiGlow 3s ease-in-out infinite;
        }

        .event-card {
          transition:
            transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 300ms ease,
            background-color 300ms ease,
            box-shadow 300ms ease;
        }

        .event-card:hover {
          transform: translateX(4px);
          border-color: rgba(34, 211, 238, 0.25);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.16);
        }

        @media (prefers-reduced-motion: reduce) {
          .timeline-page,
          .timeline-event,
          .timeline-line,
          .ai-node,
          .verified-node,
          .scan-line,
          .vertical-flow,
          .signal,
          .ai-card {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>

      <div className="timeline-page space-y-5">

        {/* ============================================== */}
        {/* LIVE RECONSTRUCTION STATUS */}
        {/* ============================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">

            <span className="signal size-1.5 rounded-full bg-success" />

            Chronological reconstruction active

          </div>

          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">

            <span className="flex items-center gap-1.5">
              <Radio className="size-3 text-primary" />
              LIVE EVENT STREAM
            </span>

            <span className="hidden sm:inline">
              TEMPORAL ENGINE // ONLINE
            </span>

          </div>

        </div>


        {/* ============================================== */}
        {/* HEADER */}
        {/* ============================================== */}

        <PageHeader
          title="Case Timeline"
          description="A single chronological record. Verified facts and AI working-analysis events are interleaved by time but always visually distinct — the AI layer never merges into the verified record."
          meta={
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-success/35 bg-success/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-success shadow-xs">

                <span className="size-1.5 rounded-full bg-success" />

                {verifiedCount} Verified Records

              </span>

              <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-primary shadow-xs">

                <span className="size-1.5 rounded-full bg-primary" />

                {aiCount} AI Working Hypotheses

              </span>
            </>
          }
        />


        {/* ============================================== */}
        {/* RECONSTRUCTION HUD */}
        {/* ============================================== */}

        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035] p-4">

          <div className="pointer-events-none absolute inset-0 overflow-hidden">

            <div className="scan-line absolute left-0 top-0 h-full w-[18%] bg-gradient-to-r from-transparent via-primary/[0.08] to-transparent blur-xl" />

          </div>


          <div className="relative grid gap-4 md:grid-cols-3">

            <div className="flex items-center gap-3">

              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">

                <GitBranch className="size-4" />

              </div>

              <div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  Reconstruction Mode
                </div>

                <div className="mt-0.5 text-xs font-bold">
                  Chronological
                </div>
              </div>

            </div>


            <div className="flex items-center gap-3">

              <div className="flex size-9 items-center justify-center rounded-lg border border-success/25 bg-success/10 text-success">

                <ShieldCheck className="size-4" />

              </div>

              <div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  Verified Layer
                </div>

                <div className="mt-0.5 text-xs font-bold">
                  {verifiedCount} records
                </div>
              </div>

            </div>


            <div className="flex items-center gap-3">

              <div className="flex size-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">

                <Sparkles className="size-4" />

              </div>

              <div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  AI Working Layer
                </div>

                <div className="mt-0.5 text-xs font-bold">
                  {aiCount} hypotheses
                </div>
              </div>

            </div>

          </div>

        </div>


        {/* ============================================== */}
        {/* TIMELINE */}
        {/* ============================================== */}

        <ol className="relative space-y-1">

          {timelineEvents.map((ev, i) => {

            const Icon = typeIcon[ev.type]

            const isAI =
              ev.status === 'ai-extracted'

            const isVerified =
              ev.status === 'verified'

            return (

              <li
                key={ev.id}
                className="timeline-event relative flex gap-4 pb-6 last:pb-0"
              >

                {/* timeline line */}

                {i < timelineEvents.length - 1 && (

                  <span
                    className="timeline-line absolute left-[17px] top-10 h-[calc(100%-25px)] w-px bg-border/70"
                  >
                    <span className="vertical-flow absolute left-0 top-0 h-1/4 w-full bg-primary/50" />
                  </span>

                )}


                {/* NODE */}

                <div
                  className={cn(
                    'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border shadow-xs',
                    isAI
                      ? 'ai-node border-primary/45 bg-primary/15 text-primary'
                      : isVerified
                        ? 'verified-node border-success/35 bg-success/10 text-success'
                        : 'border-border/80 bg-secondary text-muted-foreground',
                  )}
                >

                  <Icon className="size-4" />

                  {/* little signal ring */}

                  {isAI && (
                    <span className="pointer-events-none absolute inset-[-5px] rounded-full border border-primary/15" />
                  )}

                </div>


                {/* EVENT CARD */}

                <div
                  className={cn(
                    'event-card relative flex-1 overflow-hidden rounded-xl border p-4 shadow-xs',
                    isAI
                      ? 'ai-card border-primary/30 bg-primary/[0.035]'
                      : isVerified
                        ? 'border-success/20 bg-success/[0.018]'
                        : 'border-border/80 bg-card/60',
                  )}
                >

                  {/* scanner */}

                  <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">

                    <div
                      className={cn(
                        'scan-line h-full w-1/4',
                        isAI
                          ? 'bg-primary/60'
                          : isVerified
                            ? 'bg-success/40'
                            : 'bg-border',
                      )}
                    />

                  </div>


                  {/* header */}

                  <div className="flex flex-wrap items-center justify-between gap-2">

                    <div className="flex flex-wrap items-center gap-2.5">

                      <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground/90">

                        <Clock3 className="size-3 text-muted-foreground" />

                        {ev.date} · {ev.time}

                      </span>

                      <StatusBadge status={ev.status} />

                    </div>


                    {ev.confidence !== undefined && (

                      <span className="inline-flex items-center gap-1 rounded border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[9px] text-primary">

                        <Activity className="size-2.5" />

                        MODEL CONFIDENCE

                        <span className="font-bold">

                          <AnimatedConfidence value={ev.confidence} />

                          %

                        </span>

                      </span>

                    )}

                  </div>


                  {/* title */}

                  <h3 className="mt-2.5 flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">

                    {isAI && (
                      <Zap className="size-3.5 text-primary" />
                    )}

                    {isVerified && (
                      <ShieldCheck className="size-3.5 text-success" />
                    )}

                    {ev.title}

                  </h3>


                  {/* description */}

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">

                    {ev.description}

                  </p>


                  {/* source */}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2.5">

                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">

                      <span className="uppercase text-muted-foreground/60">
                        Origin Source:
                      </span>

                      <span className="font-semibold text-foreground/80">
                        {ev.source}
                      </span>

                    </div>


                    <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider">

                      {isAI ? (
                        <>
                          <Sparkles className="size-2.5 text-primary" />
                          <span className="text-primary">
                            AI WORKING LAYER
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-2.5 text-success" />
                          <span className="text-success">
                            VERIFIED RECORD
                          </span>
                        </>
                      )}

                    </div>

                  </div>

                </div>

              </li>

            )
          })}

        </ol>


        {/* ============================================== */}
        {/* END OF RECONSTRUCTION */}
        {/* ============================================== */}

        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-secondary/25 p-4">

          <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">

            <div className="scan-line h-full w-1/4 bg-primary/40" />

          </div>


          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-2">

              <div className="flex size-7 items-center justify-center rounded-full border border-success/25 bg-success/10 text-success">

                <ShieldCheck className="size-3.5" />

              </div>

              <div>

                <p className="text-xs font-bold">
                  Reconstruction integrity maintained
                </p>

                <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  AI working analysis remains cryptographically separated
                </p>

              </div>

            </div>


            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">

              <Activity className="size-3 text-primary" />

              Timeline engine synchronized

            </div>

          </div>

        </div>

      </div>
    </>
  )
}