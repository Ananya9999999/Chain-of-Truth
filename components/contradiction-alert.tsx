'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  MessageSquareText,
  Video,
  Check,
  X,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Activity,
  Clock3,
  Fingerprint,
  ArrowRight,
  ScanLine,
  UserRoundCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Resolution = 'pending' | 'confirmed' | 'dismissed'

export function ContradictionAlert() {
  const [resolution, setResolution] = useState<Resolution>('pending')

  const resolved = resolution !== 'pending'
  const confirmed = resolution === 'confirmed'

  return (
    <>
      <style jsx>{`
        @keyframes alertReveal {
          from {
            opacity: 0;
            transform: translateY(15px);
            filter: blur(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes dangerPulse {
          0%,
          100% {
            opacity: 0.35;
            box-shadow: 0 0 0 rgba(239, 68, 68, 0);
          }

          50% {
            opacity: 1;
            box-shadow: 0 0 18px rgba(239, 68, 68, 0.22);
          }
        }

        @keyframes warningPulse {
          0%,
          100% {
            box-shadow:
              0 0 0 rgba(245, 158, 11, 0),
              inset 0 0 0 rgba(245, 158, 11, 0);
          }

          50% {
            box-shadow:
              0 0 28px rgba(245, 158, 11, 0.07),
              inset 0 0 20px rgba(245, 158, 11, 0.02);
          }
        }

        @keyframes scan {
          0% {
            transform: translateX(-150%);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          80% {
            opacity: 0.25;
          }

          100% {
            transform: translateX(500%);
            opacity: 0;
          }
        }

        @keyframes flowLine {
          from {
            transform: translateX(-100%);
          }

          to {
            transform: translateX(350%);
          }
        }

        @keyframes confidenceFill {
          from {
            width: 0%;
          }

          to {
            width: 91%;
          }
        }

        @keyframes dataBlink {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes crosshair {
          0%,
          100% {
            transform: scale(0.92);
          }

          50% {
            transform: scale(1.05);
          }
        }

        .alert-reveal {
          animation: alertReveal 0.7s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .danger-pulse {
          animation: dangerPulse 2s ease-in-out infinite;
        }

        .warning-pulse {
          animation: warningPulse 2.8s ease-in-out infinite;
        }

        .scan {
          animation: scan 3.5s ease-in-out infinite;
        }

        .flow-line {
          animation: flowLine 3s linear infinite;
        }

        .confidence-fill {
          animation: confidenceFill 1.3s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .data-blink {
          animation: dataBlink 1.8s ease-in-out infinite;
        }

        .crosshair {
          animation: crosshair 2.5s ease-in-out infinite;
        }

        .evidence-card {
          transition:
            transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 300ms ease,
            background-color 300ms ease,
            box-shadow 300ms ease;
        }

        .evidence-card:hover {
          transform: translateY(-3px);
          border-color: rgba(34, 211, 238, 0.25);
          box-shadow: 0 12px 35px -25px rgba(0, 0, 0, 0.8);
        }

        .action-button {
          transition:
            transform 250ms ease,
            box-shadow 250ms ease;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .alert-reveal,
          .danger-pulse,
          .warning-pulse,
          .scan,
          .flow-line,
          .confidence-fill,
          .data-blink,
          .crosshair {
            animation: none;
          }
        }
      `}</style>

      <div
        className={cn(
          'alert-reveal relative overflow-hidden rounded-2xl border p-5 shadow-lg sm:p-6',
          confirmed
            ? 'border-danger/40 bg-danger/[0.035]'
            : resolution === 'dismissed'
              ? 'border-border/80 bg-secondary/25'
              : 'warning-pulse border-warning/35 bg-warning/[0.025]',
        )}
      >

        {/* ================================================= */}
        {/* AMBIENT EFFECTS */}
        {/* ================================================= */}

        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-danger/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-warning/[0.025] blur-3xl" />


        {/* ================================================= */}
        {/* LEFT SEVERITY RAIL */}
        {/* ================================================= */}

        <span
          className={cn(
            'absolute inset-y-0 left-0 w-1',
            confirmed
              ? 'bg-danger'
              : resolution === 'dismissed'
                ? 'bg-muted-foreground/30'
                : 'bg-warning',
          )}
        />

        {/* moving rail signal */}

        {!resolved && (
          <span className="pointer-events-none absolute left-0 top-0 h-20 w-1 overflow-hidden">
            <span className="scan absolute h-1/3 w-full bg-danger shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
          </span>
        )}


        {/* ================================================= */}
        {/* TOP HUD */}
        {/* ================================================= */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3 pl-1">

          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">

            <Activity className="size-3 text-danger" />

            Temporal Consistency Monitor

          </div>


          <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">

            <span className="flex items-center gap-1.5">

              <span
                className={cn(
                  'data-blink size-1.5 rounded-full',
                  resolved ? 'bg-muted-foreground' : 'bg-danger',
                )}
              />

              {resolved ? 'INCIDENT REVIEWED' : 'ANOMALY DETECTED'}

            </span>

            <span className="hidden sm:inline">
              CF-07 // TEMPORAL ENGINE
            </span>

          </div>

        </div>


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex flex-wrap items-start justify-between gap-4 pl-1">

          <div className="flex min-w-0 items-start gap-3">

            <div
              className={cn(
                'relative flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs',
                confirmed
                  ? 'border-danger/35 bg-danger/15 text-danger'
                  : resolution === 'dismissed'
                    ? 'border-border bg-secondary text-muted-foreground'
                    : 'border-warning/35 bg-warning/12 text-warning',
              )}
            >

              {!resolved && (
                <span className="danger-pulse absolute inset-[-4px] rounded-xl border border-danger/20" />
              )}

              <AlertTriangle className="relative size-5" />

            </div>


            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                  Possible Contradiction Detected
                </h2>

                <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider text-primary">

                  <Sparkles className="size-2.5" />

                  AI-LAYER

                </span>

              </div>


              <p className="mt-1 font-mono text-[9.5px] leading-relaxed text-muted-foreground">

                FLAG <span className="font-bold text-foreground/80">CF-07</span>

                <span className="mx-1.5 text-border">·</span>

                TEMPORAL CROSS-CHECK

                <span className="mx-1.5 text-border">·</span>

                HUMAN REVIEW REQUIRED

              </p>

            </div>

          </div>


          {/* severity */}

          <div className="flex items-center gap-2">

            <span className="inline-flex items-center gap-1.5 rounded border border-danger/30 bg-danger/10 px-2 py-1 font-mono text-[8.5px] font-bold tracking-wider text-danger uppercase">

              <span className="danger-pulse size-1.5 rounded-full bg-danger" />

              HIGH

            </span>

            <span className="rounded border border-border/70 bg-secondary/70 px-2 py-1 font-mono text-[8.5px] font-bold tracking-wider text-muted-foreground">

              91% CONFIDENCE

            </span>

          </div>

        </div>


        {/* ================================================= */}
        {/* CONFLICT VISUALIZER */}
        {/* ================================================= */}

        <div className="mt-5 grid gap-3 pl-1 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">


          {/* VERIFIED RECORD */}

          <div className="evidence-card relative overflow-hidden rounded-xl border border-success/20 bg-success/[0.025] p-3.5">

            <div className="flex items-center justify-between border-b border-border/50 pb-2">

              <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">

                <MessageSquareText className="size-3.5 text-success" />

                Verified Record

              </span>

              <span className="rounded border border-success/20 bg-success/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-success">

                WS-201

              </span>

            </div>


            <p className="mt-3 text-xs leading-relaxed text-foreground">

              Witness statement reports subject departure at

              <span className="mx-1.5 inline-flex rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 font-mono font-bold text-warning">

                9:00 PM

              </span>

              heading north on Mill Street.

            </p>


            <div className="mt-3 flex items-center gap-1.5 font-mono text-[8px] uppercase text-success">

              <ShieldCheck className="size-3" />

              Cryptographically sealed

            </div>

          </div>


          {/* CENTER CONFLICT */}

          <div className="flex items-center justify-center">

            <div className="relative flex size-11 items-center justify-center rounded-full border border-danger/30 bg-danger/[0.07] text-danger">

              <span className="danger-pulse absolute inset-[-5px] rounded-full border border-danger/15" />

              <ArrowRight className="hidden size-4 sm:block" />

              <AlertTriangle className="size-4 sm:hidden" />

            </div>

          </div>


          {/* CCTV */}

          <div className="evidence-card relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.025] p-3.5">

            <div className="flex items-center justify-between border-b border-border/50 pb-2">

              <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">

                <Video className="size-3.5 text-primary" />

                CCTV Evidence

              </span>

              <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-primary">

                RVS-04

              </span>

            </div>


            <p className="mt-3 text-xs leading-relaxed text-foreground">

              Subject appears at entrance at

              <span className="mx-1.5 inline-flex rounded border border-danger/30 bg-danger/10 px-1.5 py-0.5 font-mono font-bold text-danger">

                9:25 PM

              </span>

              matching the suspect physical description.

            </p>


            <div className="mt-3 flex items-center gap-1.5 font-mono text-[8px] uppercase text-primary">

              <Fingerprint className="size-3" />

              Cryptographic match

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* CONFLICT TIMELINE */}
        {/* ================================================= */}

        <div className="mt-4 pl-1">

          <div className="relative overflow-hidden rounded-lg border border-danger/15 bg-danger/[0.025] p-3">

            <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-danger/10">

              <div className="flow-line absolute h-px w-1/4 bg-danger/40" />

            </div>


            <div className="relative flex items-center justify-between gap-2">

              <div className="flex items-center gap-2">

                <div className="flex size-7 items-center justify-center rounded-md border border-success/20 bg-success/10">

                  <Clock3 className="size-3.5 text-success" />

                </div>

                <div>

                  <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                    Reported Departure
                  </p>

                  <p className="font-mono text-xs font-bold text-success">
                    21:00
                  </p>

                </div>

              </div>


              <div className="flex flex-col items-center">

                <span className="rounded border border-danger/30 bg-danger/10 px-2 py-1 font-mono text-[8px] font-black text-danger">
                  +25 MIN
                </span>

                <span className="mt-1 font-mono text-[7px] uppercase text-danger/70">
                  conflict
                </span>

              </div>


              <div className="flex items-center gap-2 text-right">

                <div>

                  <p className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                    CCTV Observation
                  </p>

                  <p className="font-mono text-xs font-bold text-primary">
                    21:25
                  </p>

                </div>

                <div className="flex size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10">

                  <Video className="size-3.5 text-primary" />

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* FORENSIC ANALYSIS */}
        {/* ================================================= */}

        <div className="mt-4 pl-1">

          <div className="rounded-xl border border-border/60 bg-secondary/25 p-3.5">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex items-center gap-2">

                <div className="crosshair flex size-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">

                  <ScanLine className="size-3.5" />

                </div>

                <div>

                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-primary">
                    Forensic Analysis
                  </p>

                  <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                    Temporal consistency engine detected an unresolved conflict.
                  </p>

                </div>

              </div>


              <span className="font-mono text-[8px] uppercase text-muted-foreground">
                Δt = 25 minutes
              </span>

            </div>


            {/* confidence */}

            <div className="mt-3">

              <div className="mb-1.5 flex items-center justify-between font-mono text-[8px] uppercase tracking-wider">

                <span className="text-muted-foreground">
                  Model Confidence
                </span>

                <span className="font-bold text-danger">
                  91%
                </span>

              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">

                <div className="confidence-fill h-full rounded-full bg-danger shadow-[0_0_10px_rgba(239,68,68,0.3)]" />

              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* ACTION AREA */}
        {/* ================================================= */}

        {!resolved ? (

          <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-4 pl-1 sm:flex-row sm:items-center">

            <div className="flex flex-wrap gap-2">

              <Button
                onClick={() => setResolution('confirmed')}
                size="sm"
                className="action-button cursor-pointer border border-danger/40 bg-danger text-danger-foreground shadow-sm hover:bg-danger/90 hover:shadow-lg"
              >

                <Check className="mr-1.5 size-3.5" />

                Confirm Contradiction

              </Button>


              <Button
                onClick={() => setResolution('dismissed')}
                variant="outline"
                size="sm"
                className="action-button cursor-pointer"
              >

                <X className="mr-1.5 size-3.5" />

                Dismiss as Non-Issue

              </Button>

            </div>


            <div className="ml-auto flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-wider text-muted-foreground">

              <UserRoundCheck className="size-3 text-primary" />

              Human decision required

            </div>

          </div>

        ) : (

          <div
            className={cn(
              'mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 pl-3',
              confirmed
                ? 'border-danger/35 bg-danger/10'
                : 'border-border/80 bg-secondary/50',
            )}
          >

            <div className="flex items-center gap-2.5">

              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border',
                  confirmed
                    ? 'border-danger/40 bg-danger/20 text-danger'
                    : 'border-border bg-muted text-muted-foreground',
                )}
              >

                {confirmed ? (
                  <Check className="size-3.5" />
                ) : (
                  <X className="size-3.5" />
                )}

              </div>


              <div>

                <p className="text-xs font-bold text-foreground">

                  {confirmed
                    ? 'Contradiction Confirmed by Officer'
                    : 'Dismissed as Non-Issue by Officer'}

                </p>


                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[9px] text-muted-foreground">

                  <ShieldCheck className="size-3 text-success" />

                  Logged to immutable audit trail

                  <span>·</span>

                  {caseTime()}

                  <span>·</span>

                  Det. A. Mreyen

                </p>

              </div>

            </div>


            <Button
              variant="ghost"
              size="xs"
              onClick={() => setResolution('pending')}
              className="cursor-pointer font-mono text-[9px] text-muted-foreground hover:text-foreground"
            >

              <RotateCcw className="mr-1 size-3" />

              Undo Decision

            </Button>

          </div>

        )}

      </div>
    </>
  )
}

function caseTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}