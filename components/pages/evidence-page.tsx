'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/pages/page-header'
import { StatusBadge } from '@/components/status-badge'
import { evidenceItems } from '@/lib/mock-data'
import {
  Hash,
  Users,
  ShieldCheck,
  Check,
  Clock,
  Lock,
  Database,
  Fingerprint,
  Activity,
  Zap,
  Link2,
  ScanLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function AnimatedNumber({
  value,
  duration = 900,
}: {
  value: number
  duration?: number
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const progress = Math.min(
        (currentTime - startTime) / duration,
        1,
      )

      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * value)

      setDisplay(start)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)

    return () => {
      setDisplay(value)
    }
  }, [value, duration])

  return <>{display}</>
}

export function EvidencePage() {
  const verified = evidenceItems.filter(
    (e) => e.status === 'verified',
  ).length

  const confirmed = evidenceItems.filter(
    (e) => e.twoPersonConfirmed,
  ).length

  const pending = evidenceItems.length - confirmed

  const integrity =
    evidenceItems.length > 0
      ? Math.round((verified / evidenceItems.length) * 100)
      : 0

  return (
    <>
      <style jsx>{`
        @keyframes pageReveal {
          from {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes cardReveal {
          from {
            opacity: 0;
            transform: translateY(25px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.85);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @keyframes radar {
          0% {
            transform: scale(0.7);
            opacity: 0.7;
          }

          100% {
            transform: scale(2.1);
            opacity: 0;
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
            opacity: 0.4;
          }

          100% {
            transform: translateX(500%);
            opacity: 0;
          }
        }

        @keyframes hashGlow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(34, 211, 238, 0);
          }

          50% {
            box-shadow: 0 0 25px rgba(34, 211, 238, 0.07);
          }
        }

        @keyframes chainFlow {
          from {
            transform: translateX(-100%);
          }

          to {
            transform: translateX(300%);
          }
        }

        @keyframes barFill {
          from {
            width: 0%;
          }
        }

        .page-reveal {
          animation: pageReveal 0.7s cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        .card-reveal {
          opacity: 0;
          animation: cardReveal 0.65s
            cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .card-reveal:nth-child(1) {
          animation-delay: 0.1s;
        }

        .card-reveal:nth-child(2) {
          animation-delay: 0.2s;
        }

        .card-reveal:nth-child(3) {
          animation-delay: 0.3s;
        }

        .card-reveal:nth-child(4) {
          animation-delay: 0.4s;
        }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        .radar {
          animation: radar 2.4s ease-out infinite;
        }

        .scan {
          animation: scan 3s ease-in-out infinite;
        }

        .hash-glow {
          animation: hashGlow 3s ease-in-out infinite;
        }

        .chain-flow {
          animation: chainFlow 3s linear infinite;
        }

        .bar-fill {
          animation: barFill 1.2s cubic-bezier(0.22, 1, 0.36, 1)
            forwards;
        }

        .evidence-row {
          position: relative;
          transition:
            background-color 300ms ease,
            transform 300ms ease;
        }

        .evidence-row::after {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          width: 2px;
          height: 100%;
          background: rgb(34 211 238);
          opacity: 0;
          transform: scaleY(0);
          transition:
            opacity 300ms ease,
            transform 300ms ease;
        }

        .evidence-row:hover {
          background: rgba(34, 211, 238, 0.035);
        }

        .evidence-row:hover::after {
          opacity: 0.8;
          transform: scaleY(1);
        }

        @media (prefers-reduced-motion: reduce) {
          .page-reveal,
          .card-reveal,
          .pulse,
          .radar,
          .scan,
          .hash-glow,
          .chain-flow,
          .bar-fill {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>

      <div className="page-reveal space-y-5">

        {/* ================================================= */}
        {/* SYSTEM STATUS */}
        {/* ================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">

          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">

            <span className="pulse size-1.5 rounded-full bg-success" />

            Evidence integrity monitor online

          </div>

          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">

            <span className="flex items-center gap-1.5">
              <Activity className="size-3 text-primary" />
              Live Verification
            </span>

            <span className="hidden sm:inline">
              CRYPTOGRAPHIC ENGINE // SHA-256
            </span>

          </div>

        </div>


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <PageHeader
          title="Evidence Vault & Chain of Custody"
          description="Every artifact is sealed with a cryptographic SHA-256 hash and requires two-officer confirmation before entering the verified case record."
          meta={
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-success/35 bg-success/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-success shadow-xs">

                <ShieldCheck className="size-3.5" />

                {verified} Verified Items

              </span>

              <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-secondary/80 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-muted-foreground shadow-xs">

                <Users className="size-3.5 text-primary" />

                {confirmed}/{evidenceItems.length} Signed

              </span>
            </>
          }
        />


        {/* ================================================= */}
        {/* VAULT COMMAND PANEL */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035] p-5">

          <div className="pointer-events-none absolute inset-0 overflow-hidden">

            <div className="scan absolute left-0 top-0 h-full w-[15%] bg-gradient-to-r from-transparent via-primary/[0.08] to-transparent blur-xl" />

          </div>


          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">

            <div className="flex items-start gap-4">

              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">

                <span className="radar absolute inset-0 rounded-xl border border-primary/30" />

                <Database className="relative size-6" />

              </div>


              <div>

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-sm font-bold">
                    Cryptographic Evidence Vault
                  </h2>

                  <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-primary">
                    SECURED
                  </span>

                </div>


                <p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
                  Every artifact receives a unique digital fingerprint
                  before it becomes part of the verified investigation
                  record.
                </p>


                <div className="mt-3 flex flex-wrap gap-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">

                  <span className="rounded border border-border/60 bg-background/40 px-2 py-1">
                    SHA-256
                  </span>

                  <span className="rounded border border-border/60 bg-background/40 px-2 py-1">
                    TWO-PERSON CUSTODY
                  </span>

                  <span className="rounded border border-border/60 bg-background/40 px-2 py-1">
                    IMMUTABLE LEDGER
                  </span>

                </div>

              </div>

            </div>


            {/* Integrity score */}

            <div className="min-w-[190px] rounded-xl border border-success/20 bg-success/[0.035] p-4">

              <div className="flex items-center justify-between">

                <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                  Integrity Score
                </span>

                <Fingerprint className="size-3.5 text-success" />

              </div>


              <div className="mt-2 flex items-end gap-1">

                <span className="font-mono text-3xl font-black text-success">
                  <AnimatedNumber value={integrity} />
                </span>

                <span className="mb-1 font-mono text-xs text-success">
                  %
                </span>

              </div>


              <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">

                <div
                  className="bar-fill h-full rounded-full bg-success"
                  style={{ width: `${integrity}%` }}
                />

              </div>

              <div className="mt-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
                Cryptographic checks passing
              </div>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* STATS */}
        {/* ================================================= */}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          {[
            {
              label: 'TOTAL ARTIFACTS',
              value: evidenceItems.length,
              icon: Database,
              tone: 'text-primary',
            },
            {
              label: 'VERIFIED',
              value: verified,
              icon: ShieldCheck,
              tone: 'text-success',
            },
            {
              label: 'SIGNED',
              value: confirmed,
              icon: Users,
              tone: 'text-primary',
            },
            {
              label: 'PENDING',
              value: pending,
              icon: Clock,
              tone: 'text-warning',
            },
          ].map((stat) => {
            const Icon = stat.icon

            return (
              <div
                key={stat.label}
                className="card-reveal group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:bg-card/80"
              >

                <div className="flex items-center justify-between">

                  <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">
                    {stat.label}
                  </span>

                  <Icon
                    className={cn('size-3.5', stat.tone)}
                  />

                </div>


                <div
                  className={cn(
                    'mt-5 font-mono text-3xl font-black',
                    stat.tone,
                  )}
                >
                  <AnimatedNumber value={stat.value} />
                </div>


                <div className="mt-2 h-px w-full bg-border/50 transition-colors duration-300 group-hover:bg-primary/30" />

              </div>
            )
          })}

        </div>


        {/* ================================================= */}
        {/* HASH CHAIN */}
        {/* ================================================= */}

        <div className="hash-glow relative overflow-hidden rounded-xl border border-border/80 bg-card/50 p-5">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>

              <div className="flex items-center gap-2">

                <Link2 className="size-4 text-primary" />

                <h2 className="text-sm font-bold">
                  Evidence Hash Chain
                </h2>

              </div>

              <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Each artifact is cryptographically linked to the previous record
              </p>

            </div>


            <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-success">

              <span className="pulse size-1.5 rounded-full bg-success" />

              Chain Valid

            </div>

          </div>


          <div className="mt-6 overflow-x-auto pb-1">

            <div className="flex min-w-[680px] items-center">

              {evidenceItems.slice(0, 5).map((ev, index) => (

                <div
                  key={ev.id}
                  className="flex flex-1 items-center"
                >

                  <div className="relative min-w-[130px] rounded-lg border border-border/70 bg-background/40 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">

                    <div className="font-mono text-[8px] font-bold text-primary">
                      {ev.id}
                    </div>

                    <div className="mt-3 truncate text-[10px] font-semibold">
                      {ev.type}
                    </div>

                    <div className="mt-2 flex items-center gap-1 font-mono text-[7px] text-success">
                      <ShieldCheck className="size-2.5" />
                      HASH VALID
                    </div>

                  </div>


                  {index < evidenceItems.slice(0, 5).length - 1 && (

                    <div className="relative mx-2 h-px min-w-[35px] flex-1 overflow-hidden bg-border/60">

                      <div className="chain-flow absolute left-0 top-0 h-full w-1/3 bg-primary/70" />

                    </div>

                  )}

                </div>

              ))}

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* EVIDENCE TABLE */}
        {/* ================================================= */}

        <div className="overflow-hidden rounded-xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-xs">

          <div className="flex items-center justify-between border-b border-border/70 bg-secondary/30 px-4 py-3">

            <div className="flex items-center gap-2">

              <ScanLine className="size-3.5 text-primary" />

              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Artifact Registry
              </span>

            </div>


            <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">
              LIVE INTEGRITY MONITOR
            </span>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[920px] border-collapse text-left text-xs">

              <thead>

                <tr className="border-b border-border/80 bg-secondary/50 font-mono text-[9.5px] tracking-wider text-muted-foreground uppercase select-none">

                  <th className="px-4 py-3 font-semibold">
                    Artifact ID
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Classification
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Source Filename
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Timestamp
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Location
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Custodian
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    SHA-256 Digest
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Sign-off
                  </th>

                  <th className="px-4 py-3 font-semibold">
                    Integrity State
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-border/50 font-sans">

                {evidenceItems.map((ev) => (

                  <tr
                    key={ev.id}
                    className="evidence-row"
                  >

                    <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">
                      {ev.id}
                    </td>


                    <td className="px-4 py-3 font-medium text-foreground">
                      {ev.type}
                    </td>


                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {ev.filename}
                    </td>


                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {ev.timestamp}
                    </td>


                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ev.location}
                    </td>


                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {ev.uploadedBy}
                    </td>


                    <td className="px-4 py-3">

                      <span className="hash-glow inline-flex items-center gap-1 rounded border border-success/20 bg-success/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-success/90">

                        <Hash className="size-2.5" />

                        {ev.hash}

                      </span>

                    </td>


                    <td className="px-4 py-3">

                      {ev.twoPersonConfirmed ? (

                        <span className="inline-flex items-center gap-1 rounded border border-success/25 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-success">

                          <Check className="size-3" />

                          Confirmed

                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-1 rounded border border-warning/25 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-warning">

                          <Clock className="size-3" />

                          1/2 Pending

                        </span>

                      )}

                    </td>


                    <td className="px-4 py-3">

                      <StatusBadge status={ev.status} />

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>


        {/* ================================================= */}
        {/* SECURITY FOOTER */}
        {/* ================================================= */}

        <div className="relative overflow-hidden rounded-lg border border-border/60 bg-secondary/30 px-3.5 py-3">

          <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">

            <div className="scan h-full w-1/4 bg-primary/50" />

          </div>


          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-muted-foreground">

            <p className="flex items-center gap-2">

              <Lock className="size-3.5 text-primary" />

              <span>
                Hashes are autonomously verified against immutable SHA-256 signatures.
              </span>

            </p>


            <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider">

              <ShieldCheck className="size-3.5 text-success" />

              Two-person custody protocol enforced

            </p>

          </div>

        </div>

      </div>
    </>
  )
}