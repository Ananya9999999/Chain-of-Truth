'use client'

import { Activity, ChevronRight, Terminal } from 'lucide-react'

export function PageHeader({
  title,
  description,
  meta,
}: {
  title: string
  description: string
  meta?: React.ReactNode
}) {
  return (
    <>
      <style jsx>{`
        @keyframes headerReveal {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes headerScan {
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

        @keyframes headerPulse {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.9);
          }

          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        .header-reveal {
          animation: headerReveal 0.6s
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .header-scan {
          animation: headerScan 4s ease-in-out infinite;
        }

        .header-pulse {
          animation: headerPulse 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .header-reveal,
          .header-scan,
          .header-pulse {
            animation: none;
          }
        }
      `}</style>

      <div className="header-reveal relative overflow-hidden border-b border-border/70 pb-4 select-none">

        {/* ============================================ */}
        {/* FORENSIC GRID */}
        {/* ============================================ */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(rgba(100,180,210,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(100,180,210,0.015)_1px,transparent_1px)] bg-[size:18px_18px]" />

        {/* ambient glow */}

        <div className="pointer-events-none absolute -left-20 -top-20 size-48 rounded-full bg-primary/[0.035] blur-3xl" />


        {/* ============================================ */}
        {/* TOP MODULE LABEL */}
        {/* ============================================ */}

        <div className="relative mb-2 flex items-center gap-2">

          <div className="flex items-center gap-1.5">

            <span className="header-pulse size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.6)]" />

            <span className="font-mono text-[7.5px] font-bold uppercase tracking-[0.18em] text-primary">
              Investigation Module
            </span>

          </div>


          <ChevronRight className="size-2.5 text-muted-foreground/40" />

          <span className="flex items-center gap-1 font-mono text-[7.5px] uppercase tracking-wider text-muted-foreground">

            <Terminal className="size-2.5" />

            FORENSIC WORKSTATION

          </span>


          <span className="hidden items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-success sm:flex">

            <Activity className="size-2.5" />

            SYSTEM ONLINE

          </span>

        </div>


        {/* ============================================ */}
        {/* MAIN HEADER */}
        {/* ============================================ */}

        <div className="relative flex flex-wrap items-end justify-between gap-4">

          <div className="min-w-0 max-w-4xl">

            <div className="flex items-center gap-2.5">

              {/* vertical accent */}

              <span className="h-7 w-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.35)]" />

              <h1 className="text-xl font-black tracking-[-0.025em] text-foreground sm:text-2xl">

                {title}

              </h1>

            </div>


            <p className="mt-2 pl-3 max-w-3xl text-[11px] leading-relaxed text-muted-foreground text-pretty">

              {description}

            </p>

          </div>


          {/* ======================================== */}
          {/* META */}
          {/* ======================================== */}

          {meta && (

            <div className="relative flex flex-wrap items-center gap-2">

              {meta}

            </div>

          )}

        </div>


        {/* ============================================ */}
        {/* SCAN LINE */}
        {/* ============================================ */}

        <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full overflow-hidden">

          <div className="header-scan h-full w-1/4 bg-primary/50 shadow-[0_0_10px_rgba(34,211,238,0.4)]" />

        </div>

      </div>
    </>
  )
}