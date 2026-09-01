'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { auditTrail } from '@/lib/mock-data'
import {
  Activity,
  Ban,
  CheckCircle2,
  Eye,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  UserCheck,
  Wifi,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function actionIcon(action: string, result: string): React.ElementType {
  if (result === 'denied') return Ban
  if (action.startsWith('Viewed')) return Eye
  if (action.startsWith('Reviewed')) return ShieldCheck
  if (action.startsWith('Uploaded')) return Upload
  if (action.startsWith('Confirmed')) return CheckCircle2
  return Sparkles
}

function resultLabel(result: string) {
  if (result === 'denied') return 'ACCESS DENIED'
  if (result === 'success') return 'VERIFIED'
  return result.toUpperCase()
}

export function AuditTrail() {
  const [activePulse, setActivePulse] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePulse((value) => !value)
    }, 1800)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes auditReveal {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes auditScan {
          0% {
            transform: translateX(-150%);
            opacity: 0;
          }

          20% {
            opacity: 0.9;
          }

          80% {
            opacity: 0.25;
          }

          100% {
            transform: translateX(500%);
            opacity: 0;
          }
        }

        @keyframes auditPulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        @keyframes auditSignal {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }

          20% {
            opacity: 0.8;
          }

          80% {
            opacity: 0.2;
          }

          100% {
            transform: translateY(500%);
            opacity: 0;
          }
        }

        .audit-reveal {
          animation: auditReveal 0.65s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .audit-scan {
          animation: auditScan 4s ease-in-out infinite;
        }

        .audit-pulse {
          animation: auditPulse 2s ease-in-out infinite;
        }

        .audit-signal {
          animation: auditSignal 3s linear infinite;
        }

        .audit-entry {
          transition:
            transform 220ms ease,
            border-color 220ms ease,
            background-color 220ms ease,
            box-shadow 220ms ease;
        }

        .audit-entry:hover {
          transform: translateX(3px);
        }

        @media (prefers-reduced-motion: reduce) {
          .audit-reveal,
          .audit-scan,
          .audit-pulse,
          .audit-signal {
            animation: none;
          }
        }
      `}</style>

      <Card className="audit-reveal relative overflow-hidden border-border/70 bg-card/50 shadow-lg backdrop-blur-xl">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/[0.045] blur-3xl" />

        {/* Moving top scanner */}
        <div className="absolute left-0 right-0 top-0 h-px overflow-hidden bg-border/30">
          <div className="audit-scan h-full w-1/4 bg-primary/60 shadow-[0_0_12px_var(--primary)]" />
        </div>


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <CardHeader className="relative border-b border-border/60 pb-3.5">

          <div className="flex items-start justify-between gap-3">

            <div className="flex items-center gap-2.5">

              <div className="relative flex size-8 items-center justify-center rounded-lg border border-success/25 bg-success/[0.07] text-success">

                <Fingerprint className="size-4" />

                <span className="audit-pulse absolute -right-1 -top-1 size-1.5 rounded-full bg-success" />

              </div>

              <div>

                <div className="flex items-center gap-2">

                  <CardTitle>
                    Immutable Access Ledger
                  </CardTitle>

                  <span className="hidden rounded border border-success/20 bg-success/10 px-1.5 py-0.5 font-mono text-[7px] font-bold tracking-wider text-success sm:inline-block">
                    LIVE
                  </span>

                </div>

                <p className="mt-0.5 font-mono text-[9px] text-muted-foreground">
                  Append-only cryptographic audit stream
                </p>

              </div>

            </div>


            {/* SECURITY STATE */}

            <div className="hidden items-center gap-1.5 rounded-md border border-success/20 bg-success/[0.05] px-2 py-1.5 font-mono text-[7px] font-bold tracking-wider text-success sm:flex">

              <Wifi className="size-2.5" />

              SECURE

            </div>

          </div>


          {/* SECURITY STRIP */}

          <div className="mt-3 grid grid-cols-3 gap-1.5">

            <AuditMetric
              icon={LockKeyhole}
              label="Storage"
              value="WORM"
            />

            <AuditMetric
              icon={ShieldCheck}
              label="Integrity"
              value="100%"
              success
            />

            <AuditMetric
              icon={Zap}
              label="Stream"
              value="ACTIVE"
              primary
            />

          </div>

        </CardHeader>


        {/* ================================================= */}
        {/* ENTRIES */}
        {/* ================================================= */}

        <CardContent className="relative pt-3.5">

          <div className="relative">

            {/* Vertical signal */}
            <span className="pointer-events-none absolute bottom-3 left-[13px] top-3 w-px overflow-hidden bg-border/50">

              <span className="audit-signal absolute left-0 top-0 h-1/4 w-full bg-success/60 shadow-[0_0_7px_var(--success)]" />

            </span>


            <ul className="space-y-1.5">

              {auditTrail.slice(0, 5).map((entry, index) => {

                const Icon = actionIcon(
                  entry.action,
                  entry.result,
                )

                const isDenied =
                  entry.result === 'denied'

                return (
                  <li
                    key={entry.id}
                    className="audit-entry relative flex items-center gap-2.5 rounded-lg border border-border/50 bg-background/20 px-2.5 py-2.5"
                    style={{
                      animationDelay: `${index * 80}ms`,
                    }}
                  >

                    {/* NODE */}

                    <div className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-secondary/80">

                      <Icon
                        className={cn(
                          'size-3',
                          isDenied
                            ? 'text-danger'
                            : 'text-muted-foreground',
                        )}
                      />

                      {!isDenied && (
                        <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-success" />
                      )}

                    </div>


                    {/* CONTENT */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <p className="truncate text-[10.5px] font-semibold text-foreground">
                          {entry.action}
                        </p>

                        <span
                          className={cn(
                            'hidden rounded border px-1 py-0.5 font-mono text-[6.5px] font-bold tracking-wider sm:inline-block',
                            isDenied
                              ? 'border-danger/25 bg-danger/10 text-danger'
                              : 'border-success/20 bg-success/10 text-success',
                          )}
                        >
                          {resultLabel(entry.result)}
                        </span>

                      </div>

                      <p className="mt-0.5 truncate font-mono text-[8px] text-muted-foreground">

                        <span className="font-semibold text-foreground/80">
                          {entry.actor}
                        </span>

                        <span className="mx-1 text-muted-foreground/40">
                          ·
                        </span>

                        {entry.role}

                      </p>

                    </div>


                    {/* TIME */}

                    <div className="shrink-0 text-right">

                      <p className="font-mono text-[8px] font-semibold text-foreground/75">
                        {entry.time}
                      </p>

                      <p className="mt-0.5 font-mono text-[6.5px] uppercase tracking-wider text-muted-foreground/50">
                        #{String(index + 1).padStart(2, '0')}
                      </p>

                    </div>

                  </li>
                )
              })}

            </ul>

          </div>


          {/* ================================================= */}
          {/* FOOTER */}
          {/* ================================================= */}

          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">

            <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground">

              <Activity className="size-2.5 text-primary" />

              Append-only stream synchronized

            </span>

            <span
              className={cn(
                'flex items-center gap-1.5 font-mono text-[7px] font-bold uppercase tracking-wider transition-opacity',
                activePulse
                  ? 'text-success opacity-100'
                  : 'text-success opacity-60',
              )}
            >

              <span className="size-1.5 rounded-full bg-success" />

              CHAIN INTACT

            </span>

          </div>

        </CardContent>
      </Card>
    </>
  )
}


/* ========================================================= */
/* METRIC */
/* ========================================================= */

function AuditMetric({
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
    <div className="rounded-md border border-border/40 bg-background/20 px-2 py-1.5">

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

      <p className="mt-0.5 font-mono text-[8px] font-bold text-foreground">
        {value}
      </p>

    </div>
  )
}