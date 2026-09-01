'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  Gauge,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Workflow,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const stages = [
  {
    number: '01',
    title: 'Evidence',
    subtitle: 'Immutable inputs',
    icon: FileSearch,
  },
  {
    number: '02',
    title: 'AI Analysis',
    subtitle: 'Working hypothesis',
    icon: BrainCircuit,
  },
  {
    number: '03',
    title: 'Human Review',
    subtitle: 'Officer adjudication',
    icon: UserCheck,
  },
  {
    number: '04',
    title: 'Verified Record',
    subtitle: 'Signed decision',
    icon: ShieldCheck,
  },
]

export function AiTransparency() {
  const [activeStage, setActiveStage] = useState(1)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse((value) => !value)
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((value) => (value + 1) % stages.length)
    }, 3200)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes aiScan {
          0% {
            transform: translateX(-160%);
            opacity: 0;
          }

          20% {
            opacity: 0.9;
          }

          80% {
            opacity: 0.2;
          }

          100% {
            transform: translateX(500%);
            opacity: 0;
          }
        }

        @keyframes aiPulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        @keyframes aiGlow {
          0%,
          100% {
            opacity: 0.2;
          }

          50% {
            opacity: 0.65;
          }
        }

        @keyframes aiFlow {
          from {
            stroke-dashoffset: 30;
          }

          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes aiReveal {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ai-scan {
          animation: aiScan 4s ease-in-out infinite;
        }

        .ai-pulse {
          animation: aiPulse 2s ease-in-out infinite;
        }

        .ai-glow {
          animation: aiGlow 3s ease-in-out infinite;
        }

        .ai-flow {
          animation: aiFlow 1.4s linear infinite;
        }

        .ai-reveal {
          animation: aiReveal 0.65s cubic-bezier(.22,1,.36,1);
        }

        .ai-stage {
          transition:
            transform 220ms ease,
            border-color 220ms ease,
            background-color 220ms ease,
            box-shadow 220ms ease;
        }

        .ai-stage:hover {
          transform: translateY(-2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .ai-scan,
          .ai-pulse,
          .ai-glow,
          .ai-flow,
          .ai-reveal {
            animation: none;
          }
        }
      `}</style>

      <Card className="ai-reveal relative overflow-hidden border-primary/15 bg-card/55 shadow-xl shadow-black/20 backdrop-blur-xl">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-primary/[0.06] blur-3xl" />

        {/* Scanner */}
        <div className="absolute left-0 right-0 top-0 h-px overflow-hidden bg-border/20">
          <div className="ai-scan h-full w-1/4 bg-primary/70 shadow-[0_0_12px_var(--primary)]" />
        </div>


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <CardHeader className="relative border-b border-border/60 pb-3.5">

          <div className="flex items-start justify-between gap-3">

            <div className="flex items-center gap-2.5">

              <div className="relative flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/10">

                <Sparkles className="size-4" />

                <span className="ai-pulse absolute -right-1 -top-1 size-1.5 rounded-full bg-primary" />

              </div>

              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <CardTitle>
                    AI Assists. Humans Decide.
                  </CardTitle>

                  <span className="inline-flex items-center gap-1 rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[7px] font-bold tracking-wider text-primary">

                    <Zap className="size-2.5" />

                    GOVERNANCE ACTIVE

                  </span>

                </div>

                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                  Algorithmic Governance & Separation Safeguards
                </p>

              </div>

            </div>


            {/* STATUS */}

            <div className="hidden items-center gap-1.5 rounded-md border border-success/20 bg-success/[0.05] px-2 py-1.5 font-mono text-[7px] font-bold tracking-wider text-success sm:flex">

              <span
                className={cn(
                  'size-1.5 rounded-full bg-success',
                  pulse && 'ai-pulse',
                )}
              />

              SANDBOX ISOLATED

            </div>

          </div>

        </CardHeader>


        <CardContent className="relative space-y-4 pt-4">


          {/* ================================================= */}
          {/* CORE PROTOCOL */}
          {/* ================================================= */}

          <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035] p-3.5">

            <div className="absolute right-0 top-0 size-28 rounded-full bg-primary/[0.06] blur-2xl" />

            <div className="relative flex gap-3">

              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">

                <LockKeyhole className="size-3.5" />

              </div>

              <div className="min-w-0">

                <div className="flex items-center gap-2">

                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                    Separation Protocol Enforced
                  </p>

                  <span className="rounded bg-success/10 px-1 py-0.5 font-mono text-[6px] font-bold text-success">
                    ACTIVE
                  </span>

                </div>

                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  AI outputs remain strictly inside the working hypothesis
                  sandbox and cannot automatically modify the court-admissible
                  verified record.
                </p>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* PIPELINE */}
          {/* ================================================= */}

          <div>

            <div className="mb-2.5 flex items-center justify-between">

              <div className="flex items-center gap-1.5">

                <Workflow className="size-3 text-primary" />

                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Decision Pipeline
                </span>

              </div>

              <span className="font-mono text-[7px] text-muted-foreground/60">
                STAGE {String(activeStage + 1).padStart(2, '0')}/04
              </span>

            </div>


            <div className="relative grid grid-cols-4 gap-1.5">

              {/* CONNECTING LINE */}

              <div className="pointer-events-none absolute left-[12%] right-[12%] top-[19px] hidden h-px bg-border/60 sm:block">

                <div
                  className="ai-flow h-full w-1/3 border-t border-dashed border-primary/70"
                  style={{
                    strokeDasharray: '5 5',
                  }}
                />

              </div>


              {stages.map((stage, index) => {

                const Icon = stage.icon
                const isActive = activeStage === index
                const completed = index < activeStage

                return (
                  <button
                    key={stage.number}
                    onClick={() => setActiveStage(index)}
                    className={cn(
                      'ai-stage relative z-10 cursor-pointer rounded-lg border p-2 text-left',
                      isActive
                        ? 'border-primary/40 bg-primary/[0.08] shadow-lg shadow-primary/[0.05]'
                        : completed
                          ? 'border-success/20 bg-success/[0.025]'
                          : 'border-border/50 bg-background/20 hover:border-border',
                    )}
                  >

                    <div className="flex justify-center">

                      <div
                        className={cn(
                          'relative flex size-8 items-center justify-center rounded-full border',
                          isActive
                            ? 'border-primary/40 bg-primary/15 text-primary'
                            : completed
                              ? 'border-success/25 bg-success/10 text-success'
                              : 'border-border/60 bg-secondary/50 text-muted-foreground',
                        )}
                      >

                        <Icon className="size-3.5" />

                        {isActive && (
                          <span className="ai-pulse absolute -inset-1 rounded-full border border-primary/30" />
                        )}

                      </div>

                    </div>


                    <div className="mt-2 text-center">

                      <p
                        className={cn(
                          'font-mono text-[7px] font-bold uppercase tracking-wider',
                          isActive
                            ? 'text-primary'
                            : completed
                              ? 'text-success'
                              : 'text-muted-foreground',
                        )}
                      >
                        {stage.number} · {stage.title}
                      </p>

                      <p className="mt-0.5 hidden text-[7px] leading-tight text-muted-foreground/70 sm:block">
                        {stage.subtitle}
                      </p>

                    </div>

                  </button>
                )
              })}

            </div>

          </div>


          {/* ================================================= */}
          {/* SAFEGUARDS */}
          {/* ================================================= */}

          <div className="space-y-1.5">

            <GovernanceItem
              icon={FileSearch}
              title="Direct Grounding Citations"
              body="Inferences link directly to immutable evidence hashes and source excerpts."
              tone="primary"
            />

            <GovernanceItem
              icon={Gauge}
              title="Calibrated Confidence Bounds"
              body="Confidence scores represent heuristic certainty, not objective fact."
              tone="neutral"
            />

            <GovernanceItem
              icon={UserCheck}
              title="Mandatory Human Adjudication"
              body="Confirmations, dismissals and overrides require human authorization."
              tone="success"
            />

          </div>


          {/* ================================================= */}
          {/* BOTTOM METRICS */}
          {/* ================================================= */}

          <div className="grid grid-cols-3 gap-1.5">

            <GovernanceMetric
              icon={Network}
              label="GROUNDING"
              value="DIRECT"
            />

            <GovernanceMetric
              icon={CheckCircle2}
              label="HUMAN GATE"
              value="REQUIRED"
              success
            />

            <GovernanceMetric
              icon={LockKeyhole}
              label="RECORD WRITE"
              value="BLOCKED"
              primary
            />

          </div>


          {/* FOOTER */}

          <div className="flex items-center justify-between border-t border-border/50 pt-3">

            <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground">

              <ShieldCheck className="size-2.5 text-success" />

              Verified / AI layers cryptographically separated

            </span>

            <span className="font-mono text-[7px] text-muted-foreground/50">
              GOV-2.4
            </span>

          </div>

        </CardContent>
      </Card>
    </>
  )
}


/* ========================================================= */
/* GOVERNANCE ITEM */
/* ========================================================= */

function GovernanceItem({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ElementType
  title: string
  body: string
  tone: 'primary' | 'success' | 'neutral'
}) {
  return (
    <div className="group flex gap-2.5 rounded-lg border border-border/50 bg-background/20 p-2.5 transition-all duration-200 hover:border-border hover:bg-card/50">

      <div
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border',
          tone === 'primary'
            ? 'border-primary/20 bg-primary/[0.07] text-primary'
            : tone === 'success'
              ? 'border-success/20 bg-success/[0.06] text-success'
              : 'border-border/50 bg-secondary/50 text-muted-foreground',
        )}
      >
        <Icon className="size-3" />
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex items-center gap-1.5">

          <p className="text-[10px] font-semibold text-foreground">
            {title}
          </p>

          <ChevronRight className="size-2.5 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />

        </div>

        <p className="mt-0.5 text-[8.5px] leading-relaxed text-muted-foreground">
          {body}
        </p>

      </div>

    </div>
  )
}


/* ========================================================= */
/* METRIC */
/* ========================================================= */

function GovernanceMetric({
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
    <div className="rounded-lg border border-border/50 bg-background/20 px-2 py-2">

      <div className="flex items-center gap-1">

        <Icon
          className={cn(
            'size-2.5',
            success
              ? 'text-success'
              : primary
                ? 'text-primary'
                : 'text-muted-foreground',
          )}
        />

        <span className="font-mono text-[6.5px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>

      </div>

      <p className="mt-1 font-mono text-[8px] font-bold text-foreground">
        {value}
      </p>

    </div>
  )
}