'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { ShieldCheck, Lock, Activity, Radio, Wifi, Cpu, Database, ChevronRight } from 'lucide-react'
import { navItems, type PageKey } from '@/lib/nav'

export function Sidebar({
  active,
  onNavigate,
}: {
  active: PageKey
  onNavigate: (key: PageKey) => void
}) {
  const [systemTick, setSystemTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTick((v) => v + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes sidebarGlow {
          0%, 100% {
            opacity: .25;
          }
          50% {
            opacity: .7;
          }
        }

        @keyframes sidebarScan {
          0% {
            transform: translateY(-120%);
            opacity: 0;
          }
          20% {
            opacity: .7;
          }
          80% {
            opacity: .15;
          }
          100% {
            transform: translateY(500%);
            opacity: 0;
          }
        }

        @keyframes sidebarPulse {
          0%, 100% {
            transform: scale(.8);
            opacity: .4;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }

        @keyframes sidebarReveal {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .sidebar-reveal {
          animation: sidebarReveal .55s cubic-bezier(.22,1,.36,1) both;
        }

        .sidebar-glow {
          animation: sidebarGlow 3s ease-in-out infinite;
        }

        .sidebar-scan {
          animation: sidebarScan 4s ease-in-out infinite;
        }

        .sidebar-pulse {
          animation: sidebarPulse 2s ease-in-out infinite;
        }

        .sidebar-nav {
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            background-color 180ms ease,
            box-shadow 180ms ease;
        }

        .sidebar-nav:hover {
          transform: translateX(3px);
        }

        @media (prefers-reduced-motion: reduce) {
          .sidebar-reveal,
          .sidebar-glow,
          .sidebar-scan,
          .sidebar-pulse {
            animation: none;
          }
        }
      `}</style>

      <aside className="sidebar-reveal relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex select-none">

        {/* AMBIENT LIGHT */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-primary/[0.06] blur-3xl" />

        {/* SIDE SCAN */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-px overflow-hidden">
          <div className="sidebar-scan h-1/4 w-full bg-primary/50 shadow-[0_0_12px_var(--primary)]" />
        </div>


        {/* ================================================= */}
        {/* BRAND */}
        {/* ================================================= */}

        <div className="relative border-b border-sidebar-border/60 px-4 py-4.5">

          <div className="flex items-center gap-3">

            <div className="relative flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/10">

              <ShieldCheck className="size-4.5" />

              <span className="sidebar-pulse absolute -right-1 -top-1 size-1.5 rounded-full bg-success" />

            </div>

            <div className="min-w-0 leading-tight">

              <div className="flex items-center gap-1.5">

                <span className="text-[13.5px] font-bold tracking-tight text-sidebar-foreground">
                  Chain of Truth
                </span>

              </div>

              <p className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-muted-foreground uppercase">
                Forensic Integrity OS
              </p>

            </div>

          </div>


          {/* SYSTEM ID */}

          <div className="mt-3 flex items-center justify-between rounded-md border border-border/30 bg-background/20 px-2 py-1.5">

            <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-wider text-muted-foreground">

              <Cpu className="size-2.5 text-primary" />

              SYSTEM NODE

            </span>

            <span className="font-mono text-[7px] font-bold text-success">
              COT-04
            </span>

          </div>

        </div>


        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">

          <div className="mb-2 flex items-center justify-between px-2.5">

            <span className="font-mono text-[8px] font-bold tracking-[0.16em] text-muted-foreground/70 uppercase">
              Investigation Modules
            </span>

            <Activity className="size-2.5 text-primary/60" />

          </div>


          {navItems.map((item, index) => {

            const isActive = active === item.key

            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'sidebar-nav group relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2.5 text-xs font-medium',
                  isActive
                    ? 'border-primary/20 bg-primary/[0.075] text-sidebar-foreground shadow-lg shadow-primary/[0.03]'
                    : 'border-transparent text-muted-foreground hover:border-border/30 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
                style={{
                  animationDelay: `${index * 45}ms`,
                }}
              >

                {/* ACTIVE LINE */}

                {isActive && (
                  <>
                    <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full bg-primary shadow-[0_0_9px_var(--primary)]" />

                    <span className="sidebar-glow absolute inset-y-2 left-0 w-5 rounded-full bg-primary/20 blur-md" />
                  </>
                )}


                {/* ICON */}

                <div
                  className={cn(
                    'relative flex size-7 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
                    isActive
                      ? 'border-primary/25 bg-primary/10 text-primary'
                      : 'border-transparent bg-secondary/20 text-muted-foreground group-hover:border-border/40 group-hover:bg-secondary/60 group-hover:text-foreground',
                  )}
                >
                  <item.icon
                    className={cn(
                      'size-3.5 transition-transform duration-200',
                      isActive && 'scale-110',
                    )}
                  />
                </div>


                {/* LABEL */}

                <span className="flex-1 text-left tracking-tight">
                  {item.label}
                </span>


                {/* BADGE */}

                {item.badge && (
                  <span
                    className={cn(
                      'rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wide',
                      item.key === 'ai-flags'
                        ? 'border-warning/30 bg-warning/10 text-warning'
                        : isActive
                          ? 'border-primary/25 bg-primary/10 text-primary'
                          : 'border-border/50 bg-secondary/60 text-muted-foreground',
                    )}
                  >
                    {item.badge}
                  </span>
                )}


                {/* ARROW */}

                {isActive && (
                  <ChevronRight className="size-3 text-primary/60" />
                )}

              </button>
            )
          })}

        </nav>


        {/* ================================================= */}
        {/* SYSTEM STATUS */}
        {/* ================================================= */}

        <div className="relative mx-3 mb-3 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/25 p-3 shadow-lg">

          {/* TOP SCANNER */}

          <div className="absolute left-0 right-0 top-0 h-px overflow-hidden bg-border/30">

            <div className="sidebar-scan h-full w-1/3 bg-success/50" />

          </div>


          {/* HEADER */}

          <div className="flex items-center justify-between">

            <p className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">

              <ShieldCheck className="size-3.5 text-success" />

              Chain of Custody

            </p>

            <span className="inline-flex items-center gap-1 rounded border border-success/25 bg-success/10 px-1.5 py-0.5 font-mono text-[7px] font-bold tracking-wider text-success">

              <span className="sidebar-pulse size-1 rounded-full bg-success" />

              INTACT

            </span>

          </div>


          {/* PROGRESS */}

          <div className="mt-3">

            <div className="mb-1.5 flex items-center justify-between">

              <span className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground">
                Evidence Integrity
              </span>

              <span className="font-mono text-[7px] font-bold text-success">
                100%
              </span>

            </div>

            <div className="h-1 overflow-hidden rounded-full bg-secondary">

              <div className="h-full w-full rounded-full bg-success shadow-[0_0_8px_var(--success)]" />

            </div>

          </div>


          <p className="mt-2.5 text-[9px] leading-relaxed text-muted-foreground">
            18/18 evidence artifacts sealed with SHA-256 integrity checks.
          </p>


          {/* SYSTEM METRICS */}

          <div className="mt-3 grid grid-cols-3 gap-1.5">

            <SystemMetric
              icon={Database}
              label="DATA"
              value="18/18"
            />

            <SystemMetric
              icon={Lock}
              label="AES"
              value="256"
            />

            <SystemMetric
              icon={Wifi}
              label="SYNC"
              value="OK"
            />

          </div>


          {/* FOOTER */}

          <div className="mt-3 flex items-center justify-between border-t border-sidebar-border/60 pt-2">

            <span className="flex items-center gap-1 font-mono text-[7px] text-muted-foreground">

              <Radio className="size-2.5 text-success" />

              SYSTEM ONLINE

            </span>

            <span className="font-mono text-[7px] text-muted-foreground/50">
              T+{String(systemTick).padStart(5, '0')}
            </span>

          </div>

        </div>


        {/* VERSION */}

        <div className="px-4 pb-3 text-center">

          <span className="font-mono text-[7px] tracking-wider text-muted-foreground/40">
            SEC-OP · FORENSIC NODE v2.4
          </span>

        </div>

      </aside>
    </>
  )
}


/* ========================================================= */
/* SYSTEM METRIC */
/* ========================================================= */

function SystemMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-border/40 bg-background/20 px-1.5 py-1.5">

      <div className="flex items-center gap-1">

        <Icon className="size-2 text-muted-foreground" />

        <span className="font-mono text-[6px] tracking-wider text-muted-foreground">
          {label}
        </span>

      </div>

      <p className="mt-0.5 font-mono text-[8px] font-bold text-foreground">
        {value}
      </p>

    </div>
  )
}