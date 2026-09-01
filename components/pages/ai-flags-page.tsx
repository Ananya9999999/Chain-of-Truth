'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { Button } from '@/components/ui/button'
import { aiFlags, type AiFlag, caseMeta } from '@/lib/mock-data'
import {
  Flag,
  Check,
  X,
  ShieldCheck,
  FileSearch,
  Sparkles,
  RotateCcw,
  BrainCircuit,
  Activity,
  Zap,
  AlertTriangle,
  ScanLine,
  Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Resolution = 'pending' | 'confirmed' | 'dismissed'

const severityStyle: Record<AiFlag['severity'], string> = {
  high: 'border-danger/40 bg-danger/10 text-danger',
  medium: 'border-warning/40 bg-warning/10 text-warning',
  low: 'border-border/80 bg-secondary/80 text-muted-foreground',
}

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AnimatedConfidence({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let current = 0
    const step = Math.max(1, Math.ceil(value / 30))

    const timer = setInterval(() => {
      current += step

      if (current >= value) {
        current = value
        clearInterval(timer)
      }

      setDisplay(current)
    }, 35)

    return () => clearInterval(timer)
  }, [value])

  return <span>{display}%</span>
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

  const pending = Object.values(responses).filter(
    (r) => r === 'pending',
  ).length

  const confirmed = Object.values(responses).filter(
    (r) => r === 'confirmed',
  ).length

  return (
    <>
      <style jsx>{`
        @keyframes pageIn {
          from {
            opacity: 0;
            transform: translateY(25px);
            filter: blur(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(35px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
            transform: scale(0.9);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes radar {
          0% {
            transform: scale(0.4);
            opacity: 0.7;
          }

          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          80% {
            opacity: 0.5;
          }

          100% {
            transform: translateX(420%);
            opacity: 0;
          }
        }

        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(34, 211, 238, 0);
          }

          50% {
            box-shadow:
              0 0 35px rgba(34, 211, 238, 0.08),
              inset 0 0 30px rgba(34, 211, 238, 0.025);
          }
        }

        @keyframes warningGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(239, 68, 68, 0);
          }

          50% {
            box-shadow:
              0 0 35px rgba(239, 68, 68, 0.08),
              inset 0 0 25px rgba(239, 68, 68, 0.025);
          }
        }

        @keyframes progress {
          from {
            width: 0%;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-4px);
          }
        }

        .page-enter {
          animation: pageIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .flag-card {
          opacity: 0;
          animation: cardIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .flag-card:nth-child(1) {
          animation-delay: 0.15s;
        }

        .flag-card:nth-child(2) {
          animation-delay: 0.28s;
        }

        .flag-card:nth-child(3) {
          animation-delay: 0.41s;
        }

        .flag-card:nth-child(4) {
          animation-delay: 0.54s;
        }

        .flag-card:hover {
          transform: translateY(-3px);
        }

        .ai-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .danger-glow {
          animation: warningGlow 2.8s ease-in-out infinite;
        }

        .pulse-dot {
          animation: pulse 1.8s ease-in-out infinite;
        }

        .radar-ring {
          animation: radar 2.5s ease-out infinite;
        }

        .scan-line {
          animation: scan 2.8s ease-in-out infinite;
        }

        .progress-bar {
          animation: progress 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .page-enter,
          .flag-card,
          .ai-glow,
          .danger-glow,
          .pulse-dot,
          .radar-ring,
          .scan-line,
          .progress-bar,
          .floating-icon {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>

      <div className="page-enter space-y-5">
        {/* ====================================================== */}
        {/* AI ENGINE STATUS BAR */}
        {/* ====================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="pulse-dot size-1.5 rounded-full bg-success" />
            AI investigation engine online
          </div>

          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Radio className="size-3 text-primary" />
              Live Analysis
            </span>

            <span className="hidden sm:inline">
              MODEL // FORENSIC-CROSSCHECK-V2
            </span>
          </div>
        </div>

        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <PageHeader
          title="AI Working Hypotheses & Conflict Flags"
          description="Temporal contradictions and routing hypotheses surfaced by the analysis engine. Every item remains outside the court-admissible record until an officer executes a signed confirmation or dismissal."
          meta={
            <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/35 bg-warning/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-warning shadow-xs">
              <Flag className="size-3" />
              {pending} Awaiting Officer Action
            </span>
          }
        />

        {/* ====================================================== */}
        {/* AI ENGINE HERO */}
        {/* ====================================================== */}

        <div className="ai-glow relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035]">
          {/* scanning light */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="scan-line absolute left-0 top-0 h-full w-[20%] bg-gradient-to-r from-transparent via-primary/[0.08] to-transparent blur-xl" />
          </div>

          <div className="relative grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <div className="radar-ring absolute inset-0 rounded-xl border border-primary/30" />
                <BrainCircuit className="floating-icon size-6" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold">
                    Forensic Intelligence Engine
                  </h2>

                  <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-primary">
                    AI WORKING LAYER
                  </span>
                </div>

                <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                  Automated cross-checking of statements, timestamps, evidence
                  metadata and geographic signals.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  <span className="rounded border border-border/60 bg-background/40 px-2 py-1">
                    Temporal Analysis
                  </span>
                  <span className="rounded border border-border/60 bg-background/40 px-2 py-1">
                    Evidence Linking
                  </span>
                  <span className="rounded border border-border/60 bg-background/40 px-2 py-1">
                    Conflict Detection
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="rounded-lg border border-warning/20 bg-warning/[0.04] px-4 py-3 text-center">
                <div className="font-mono text-lg font-bold text-warning">
                  {pending}
                </div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  Pending
                </div>
              </div>

              <div className="rounded-lg border border-danger/20 bg-danger/[0.04] px-4 py-3 text-center">
                <div className="font-mono text-lg font-bold text-danger">
                  {confirmed}
                </div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  Escalated
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* HUMAN IN LOOP */}
        {/* ====================================================== */}

        <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/[0.04] p-4 shadow-xs">
          <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">
            <div className="scan-line h-full w-1/4 bg-primary/60" />
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>

            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                <Zap className="size-3" />
                Mandatory Human-in-the-Loop Protocol
              </div>

              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                AI assists. Humans decide. Every signed response below is
                permanently appended to the tamper-evident audit ledger.
              </p>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* FLAGS */}
        {/* ====================================================== */}

        <div className="space-y-3.5">
          {aiFlags.map((flag) => {
            const resolution = responses[flag.id]
            const confirmedFlag = resolution === 'confirmed'
            const dismissed = resolution === 'dismissed'
            const resolved = resolution !== 'pending'

            return (
              <div
                key={flag.id}
                className={cn(
                  'flag-card relative overflow-hidden rounded-xl border p-4.5 shadow-xs transition-all duration-300',
                  confirmedFlag
                    ? 'danger-glow border-danger/45 bg-danger/[0.04]'
                    : dismissed
                      ? 'border-border/80 bg-secondary/30'
                      : 'ai-glow border-border/80 bg-card/60 hover:border-primary/30 hover:bg-card/80',
                )}
              >
                {/* CARD SCANNER */}
                {!resolved && (
                  <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">
                    <div className="scan-line h-full w-1/5 bg-primary/60" />
                  </div>
                )}

                {/* HEADER */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'relative flex size-9 shrink-0 items-center justify-center rounded-lg border shadow-xs',
                        flag.severity === 'high'
                          ? 'border-danger/30 bg-danger/10 text-danger'
                          : flag.severity === 'medium'
                            ? 'border-warning/30 bg-warning/10 text-warning'
                            : 'border-primary/20 bg-primary/10 text-primary',
                      )}
                    >
                      {!resolved && (
                        <span className="radar-ring absolute inset-0 rounded-lg border border-current/20" />
                      )}

                      <Flag className="relative size-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold tracking-tight text-foreground">
                          {flag.title}
                        </h2>

                        {!resolved && (
                          <span className="flex items-center gap-1 rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-primary">
                            <Activity className="size-2.5" />
                            Analyzing
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        FLAG ID:{' '}
                        <span className="font-semibold text-foreground/80">
                          {flag.id}
                        </span>{' '}
                        · SOURCE: AI WORKING LAYER
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded border px-2 py-0.5 font-mono text-[9px] tracking-wide uppercase',
                        severityStyle[flag.severity],
                      )}
                    >
                      Severity: {flag.severity}
                    </span>

                    <span className="rounded border border-border/80 bg-secondary/80 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
                      Confidence:{' '}
                      <AnimatedConfidence value={flag.confidence} />
                    </span>
                  </div>
                </div>

                {/* CONFIDENCE BAR */}
                <div className="mt-4">
                  <div className="mb-1 flex justify-between font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                    <span>Model confidence</span>
                    <span>{flag.confidence}/100</span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        'progress-bar h-full rounded-full',
                        flag.severity === 'high'
                          ? 'bg-danger'
                          : flag.severity === 'medium'
                            ? 'bg-warning'
                            : 'bg-primary',
                      )}
                      style={{
                        width: `${flag.confidence}%`,
                      }}
                    />
                  </div>
                </div>

                {/* EXPLANATION */}
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Inference Rationale:{' '}
                  </span>
                  {flag.explanation}
                </p>

                {/* EVIDENCE */}
                <div className="mt-4 rounded-lg border border-border/50 bg-background/30 p-3">
                  <div className="mb-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    <FileSearch className="size-3 text-primary" />
                    Linked Evidence
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {flag.sources.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-border/80 bg-secondary/70 px-2 py-1 font-mono text-[10px] font-medium text-foreground/90 transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ACTIONS */}
                {!resolved ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3.5">
                    <Button
                      onClick={() => resolve(flag.id, 'confirmed')}
                      size="sm"
                      className="group cursor-pointer border border-danger/40 bg-danger text-danger-foreground transition-all duration-300 hover:bg-danger/90 hover:shadow-[0_0_25px_rgba(239,68,68,0.18)]"
                    >
                      <Check className="mr-1.5 size-3.5 transition-transform group-hover:scale-125" />
                      Confirm Flag
                    </Button>

                    <Button
                      onClick={() => resolve(flag.id, 'dismissed')}
                      variant="outline"
                      size="sm"
                      className="group cursor-pointer transition-all duration-300 hover:border-primary/30"
                    >
                      <X className="mr-1.5 size-3.5 transition-transform group-hover:rotate-90" />
                      Dismiss
                    </Button>

                    <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      <span className="pulse-dot size-1.5 rounded-full bg-warning" />
                      Awaiting officer response
                    </span>
                  </div>
                ) : (
                  /* RESOLUTION */
                  <div
                    className={cn(
                      'mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 shadow-xs',
                      confirmedFlag
                        ? 'border-danger/35 bg-danger/10'
                        : 'border-border/80 bg-secondary/50',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full border',
                          confirmedFlag
                            ? 'border-danger/40 bg-danger/20 text-danger'
                            : 'border-border bg-muted text-muted-foreground',
                        )}
                      >
                        {confirmedFlag ? (
                          <AlertTriangle className="size-3.5" />
                        ) : (
                          <X className="size-3.5" />
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {confirmedFlag
                            ? 'Flag Confirmed & Escalated'
                            : 'Flag Dismissed by Officer'}
                        </p>

                        <p className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground">
                          <ShieldCheck className="size-3 text-success" />
                          Appended to audit trail ·{' '}
                          {times[flag.id] ?? nowTime()} · {caseMeta.officer}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => resolve(flag.id, 'pending')}
                      className="cursor-pointer font-mono text-[10px] text-muted-foreground transition-all hover:text-foreground"
                    >
                      <RotateCcw className="mr-1 size-3" />
                      Undo
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ====================================================== */}
        {/* FOOTER SYSTEM STATUS */}
        {/* ====================================================== */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="pulse-dot size-1.5 rounded-full bg-success" />
            Evidence analysis active
          </span>

          <span>AI output remains non-admissible until human verification</span>

          <span className="text-primary">SECURE // ENCRYPTED</span>
        </div>
      </div>
    </>
  )
}