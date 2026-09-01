'use client'

import { useEffect, useState } from 'react'
import { caseMeta } from '@/lib/mock-data'
import {
  Clock,
  FolderLock,
  BadgeCheck,
  Sparkles,
  ShieldCheck,
  Activity,
  Fingerprint,
  Radio,
  ArrowUpRight,
} from 'lucide-react'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let current = 0

    const timer = setInterval(() => {
      current += Math.max(1, Math.ceil(value / 20))

      if (current >= value) {
        current = value
        clearInterval(timer)
      }

      setDisplay(current)
    }, 35)

    return () => clearInterval(timer)
  }, [value])

  return <>{display}</>
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType
  value: number
  label: string
  tone: 'neutral' | 'success' | 'primary'
}) {
  const toneMap = {
    neutral:
      'border-border/70 bg-card/45 hover:border-primary/20',
    success:
      'border-success/20 bg-success/[0.035] hover:border-success/35',
    primary:
      'border-primary/20 bg-primary/[0.035] hover:border-primary/35',
  }

  const iconToneMap = {
    neutral: 'text-primary',
    success: 'text-success',
    primary: 'text-primary',
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border px-3.5 py-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${toneMap[tone]}`}
    >
      {/* animated top scanner */}

      <div className="pointer-events-none absolute left-0 top-0 h-px w-full overflow-hidden">
        <div
          className={`case-scan absolute h-full w-1/3 ${
            tone === 'success'
              ? 'bg-success/60'
              : 'bg-primary/60'
          }`}
        />
      </div>

      <div className="flex items-center gap-3">

        <div className="flex size-8.5 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-secondary/60 transition-transform duration-300 group-hover:scale-110">
          <Icon className={`size-4 ${iconToneMap[tone]}`} />
        </div>

        <div className="min-w-0 leading-tight">

          <p className="font-mono text-lg font-bold tracking-tight text-foreground">
            <AnimatedNumber value={value} />
          </p>

          <p className="truncate font-mono text-[8.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>

        </div>

      </div>
    </div>
  )
}

export function CaseHeader() {
  return (
    <>
      <style jsx>{`
        @keyframes caseReveal {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes caseScan {
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
            transform: translateX(450%);
            opacity: 0;
          }
        }

        @keyframes statusPulse {
          0%,
          100% {
            opacity: 0.35;
          }

          50% {
            opacity: 1;
          }
        }

        @keyframes radarPulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.25;
          }

          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }

        @keyframes lineFlow {
          from {
            transform: translateX(-100%);
          }

          to {
            transform: translateX(300%);
          }
        }

        @keyframes integrityGlow {
          0%,
          100% {
            box-shadow:
              0 0 0 rgba(34, 197, 94, 0),
              inset 0 0 0 rgba(34, 197, 94, 0);
          }

          50% {
            box-shadow:
              0 0 30px rgba(34, 197, 94, 0.06),
              inset 0 0 20px rgba(34, 197, 94, 0.02);
          }
        }

        .case-header {
          animation: caseReveal 0.7s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .case-scan {
          animation: caseScan 3.5s ease-in-out infinite;
        }

        .status-pulse {
          animation: statusPulse 2s ease-in-out infinite;
        }

        .radar-pulse {
          animation: radarPulse 2.5s ease-in-out infinite;
        }

        .line-flow {
          animation: lineFlow 3s linear infinite;
        }

        .integrity-glow {
          animation: integrityGlow 3.5s ease-in-out infinite;
        }

        .stat-card {
          transition:
            transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 300ms ease,
            box-shadow 300ms ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
        }

        @media (prefers-reduced-motion: reduce) {
          .case-header,
          .case-scan,
          .status-pulse,
          .radar-pulse,
          .line-flow,
          .integrity-glow {
            animation: none;
          }
        }
      `}</style>

      <div className="case-header relative overflow-hidden rounded-2xl border border-primary/15 bg-card/45 shadow-xl backdrop-blur-xl">

        {/* ================================================= */}
        {/* AMBIENT GLOW */}
        {/* ================================================= */}

        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/[0.045] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-primary/[0.025] blur-3xl" />


        {/* ================================================= */}
        {/* TOP DATA LINE */}
        {/* ================================================= */}

        <div className="relative flex h-1 overflow-hidden bg-secondary/40">

          <div className="line-flow absolute h-full w-1/4 bg-primary/50" />

        </div>


        <div className="relative p-5 sm:p-6">

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">


            {/* ================================================= */}
            {/* CASE IDENTITY */}
            {/* ================================================= */}

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-2">

                {/* Case ID */}

                <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/[0.05] px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-primary">

                  <Fingerprint className="size-3" />

                  CASE #{caseMeta.id}

                </span>


                {/* LIVE */}

                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/[0.07] px-2.5 py-1 font-mono text-[9px] font-bold tracking-wider text-success">

                  <span className="relative flex size-1.5">

                    <span className="status-pulse absolute inline-flex size-full rounded-full bg-success" />

                    <span className="relative inline-flex size-1.5 rounded-full bg-success" />

                  </span>

                  {caseMeta.status}

                </span>


                {/* LIVE ENGINE */}

                <span className="hidden items-center gap-1.5 rounded border border-border/50 bg-secondary/40 px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground sm:inline-flex">

                  <Radio className="size-2.5 text-primary" />

                  Investigation Engine Online

                </span>

              </div>


              {/* TITLE */}

              <div className="mt-3 flex items-start gap-3">

                <div className="hidden size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.06] text-primary sm:flex">

                  <ShieldCheck className="size-5" />

                </div>


                <div className="min-w-0">

                  <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-[26px]">

                    {caseMeta.title}

                  </h1>

                  <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">

                    Forensic evidence reconstruction and integrity monitoring environment.

                  </p>

                </div>

              </div>


              {/* AUDIT INFORMATION */}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">

                  <Clock className="size-3 text-primary/70" />

                  <span>
                    Last audit:
                  </span>

                  <span className="font-mono font-semibold text-foreground/80">
                    {caseMeta.lastUpdated}
                  </span>

                </div>


                <div className="hidden h-3 w-px bg-border/60 sm:block" />


                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">

                  <span>
                    Lead:
                  </span>

                  <span className="font-semibold text-foreground/80">
                    {caseMeta.officer}
                  </span>

                </div>


                <div className="hidden h-3 w-px bg-border/60 sm:block" />


                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-success">

                  <span className="status-pulse size-1.5 rounded-full bg-success" />

                  Record Integrity Verified

                </div>

              </div>

            </div>


            {/* ================================================= */}
            {/* SYSTEM INTEGRITY PANEL */}
            {/* ================================================= */}

            <div className="integrity-glow relative overflow-hidden rounded-xl border border-success/15 bg-success/[0.025] p-3.5 xl:w-60">

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,200,210,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(120,200,210,0.018)_1px,transparent_1px)] bg-[size:20px_20px]" />

              <div className="relative flex items-center justify-between">

                <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-muted-foreground">

                  <Activity className="size-3 text-success" />

                  System Integrity

                </span>

                <span className="font-mono text-[9px] font-bold text-success">
                  SECURE
                </span>

              </div>


              <div className="relative mt-3 flex items-end justify-between">

                <div>

                  <span className="font-mono text-3xl font-black tracking-tight text-foreground">
                    100
                  </span>

                  <span className="ml-1 font-mono text-sm font-bold text-success">
                    %
                  </span>

                </div>


                <div className="flex items-center gap-1 rounded border border-success/20 bg-success/10 px-1.5 py-0.5 font-mono text-[7px] font-bold text-success">

                  <ShieldCheck className="size-2.5" />

                  VERIFIED

                </div>

              </div>


              <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">

                <div className="h-full w-full rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.35)]" />

              </div>


              <div className="relative mt-2 flex items-center justify-between font-mono text-[7px] uppercase tracking-wider text-muted-foreground">

                <span>
                  Hash chain
                </span>

                <span className="text-success">
                  SHA-256 OK
                </span>

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* STATISTICS */}
          {/* ================================================= */}

          <div className="mt-6 grid gap-2 border-t border-border/50 pt-4 sm:grid-cols-3">

            <Stat
              icon={FolderLock}
              value={caseMeta.evidenceCount}
              label="Evidence Items"
              tone="neutral"
            />

            <Stat
              icon={BadgeCheck}
              value={caseMeta.verifiedCount}
              label="Verified Record"
              tone="success"
            />

            <Stat
              icon={Sparkles}
              value={caseMeta.unverifiedFindings}
              label="AI Hypotheses"
              tone="primary"
            />

          </div>


          {/* ================================================= */}
          {/* FOOTER STATUS STRIP */}
          {/* ================================================= */}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/20 px-3 py-2">

            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">

              <span className="status-pulse size-1.5 rounded-full bg-primary" />

              Case monitoring active

            </div>


            <div className="flex items-center gap-3 font-mono text-[8px] uppercase tracking-wider text-muted-foreground">

              <span className="hidden sm:inline">
                Evidence integrity
              </span>

              <span className="font-bold text-success">
                100% VERIFIED
              </span>

              <ArrowUpRight className="size-3 text-primary/50" />

            </div>

          </div>

        </div>

      </div>
    </>
  )
}